<?php

// Dependency behavior witnesses; no application records, mail delivery or external sockets.
declare(strict_types=1);

use Egulias\EmailValidator\EmailValidator;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request as LaravelRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\View\Compilers\BladeCompiler;
use Illuminate\View\Component;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Fragment\InlineFragmentRenderer;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mailer\Transport\Smtp\SmtpTransport;
use Symfony\Component\Mailer\Transport\Smtp\Stream\AbstractStream;
use Symfony\Component\Routing\Exception\InvalidParameterException;
use Symfony\Component\Routing\Generator\UrlGenerator;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\Route;
use Symfony\Component\Routing\RouteCollection;

$root = getenv('DEPENDENCY_REGRESSION_ROOT') ?: dirname(__DIR__, 2);
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

function check(bool $condition, string $message): void
{
    if (! $condition) {
        throw new RuntimeException($message);
    }
}

class DependencySecurityComponent extends Component
{
    public function render(): string
    {
        return '<span {{ $attributes }}>safe</span>';
    }
}
class DependencySecurityStream extends AbstractStream
{
    public bool $handshake = false;

    public function initialize(): void {}

    public function write(string $bytes, bool $debug = true): void {}

    public function readLine(): string
    {
        return "250 Synthetic plaintext fallback accepted\r\n";
    }

    protected function getReadConnectionDescription(): string
    {
        return 'synthetic stream';
    }

    public function isTLS(): bool
    {
        return false;
    }

    public function hasPendingData(): bool
    {
        return true;
    }

    public function startTLS(): bool
    {
        $this->handshake = true;

        return true;
    }
}
class DependencySecuritySmtp extends EsmtpTransport
{
    public bool $rejectEhlo = false;

    public DependencySecurityStream $fixtureStream;

    public function __construct()
    {
        parent::__construct('localhost', 25, false);
        $this->fixtureStream = new DependencySecurityStream;
        (new ReflectionProperty(SmtpTransport::class, 'stream'))->setValue($this, $this->fixtureStream);
    }

    public function executeCommand(string $command, array $codes): string
    {
        if (str_starts_with($command, 'EHLO ')) {
            if ($this->rejectEhlo) {
                throw new TransportException('Synthetic EHLO rejection');
            }

            return "250-safe\r\n250 STARTTLS\r\n";
        }
        if ($command === "STARTTLS\r\n") {
            return "220 Ready\r\n";
        }

        return parent::executeCommand($command, $codes);
    }
}

$failures = [];
function witness(string $name, Closure $test): void
{
    global $failures;
    try {
        $test();
        echo "PASS $name\n";
    } catch (Throwable $error) {
        $failures[] = $name;
        fwrite(STDERR, "FAIL $name: {$error->getMessage()}\n");
    }
}

witness('GHSA-c25c-x5r7-2v5m bounded numeric exponents', function () {
    foreach (['multiple_of:2', 'gt:other', 'gte:other', 'lt:other', 'lte:other'] as $rule) {
        check(Validator::make(['value' => '1e10000', 'other' => 2], ['value' => ['numeric', $rule]])->fails(), $rule.' accepted extreme exponent');
    }
    check(Validator::make(['value' => 4], ['value' => 'numeric|multiple_of:2'])->passes(), 'Normal arithmetic regressed');
});
witness('GHSA-cvfq-f547-rv2g email byte limit', function () use ($app) {
    $original = $app->make(EmailValidator::class);
    $spy = Mockery::mock(EmailValidator::class);
    $spy->shouldReceive('isValid')->andReturnUsing(function () {
        throw new RuntimeException('Oversized email reached expensive IDN validation');
    });
    $app->instance(EmailValidator::class, $spy);
    try {
        check(Validator::make(['email' => 'a@'.str_repeat('é', 128).'.test'], ['email' => 'email'])->fails(), 'Oversized Unicode email accepted');
    } finally {
        $app->instance(EmailValidator::class, $original);
    }
    check(Validator::make(['email' => 'qa@example.test'], ['email' => 'email'])->passes(), 'Normal email rejected');
});
witness('GHSA-cq3g-fj94-c8p3 empty wildcard key', function () {
    check(Validator::make(['items' => ['' => ['name' => 'safe', 'unexpected' => 'unsafe']]], ['items.*' => 'array:name'])->fails(), 'Empty key bypassed nested array rule');
    check(Validator::make(['items' => ['' => ['name' => 'safe']]], ['items.*' => 'array:name'])->passes(), 'Valid empty-key element rejected');
});
witness('GHSA-hxc4-wvjf-r59p colliding optional upload', function () {
    foreach ([null, '', []] as $empty) {
        $file = UploadedFile::fake()->createWithContent('unsafe.txt', 'not an image');
        $request = new LaravelRequest([], ['attachment' => $empty], [], [], ['attachment' => $file]);
        $request->setMethod('POST');
        check($request->all()['attachment'] instanceof UploadedFile, 'Empty scalar shadowed upload');
        check(Validator::make($request->all(), ['attachment' => 'nullable|image'])->fails(), 'Invalid optional upload bypassed validation');
    }
});
witness('GHSA-6pxv-c29g-cc5h normalized mass-assignment guard', function () {
    $model = new class extends Model
    {
        protected $guarded = ['is_admin'];

        public function setIsAdminAttribute($value): void
        {
            $this->attributes['is_admin'] = $value;
        }
    };
    foreach (['is-admin', 'is admin', 'is_admin'] as $key) {
        check($model->isGuarded($key), 'Guard normalization bypass: '.$key);
    }
});
witness('GHSA-ch34-gjmh-c4hp literal database-rule scopes', function () {
    foreach (['NULL', 'NOT_NULL', '!another'] as $value) {
        foreach ([Rule::exists('records', 'id'), Rule::unique('records', 'id')] as $rule) {
            $conditions = $rule->where('tenant', $value)->queryConditions();
            $query = new class
            {
                public array $calls = [];

                public function where(...$args): self
                {
                    $this->calls[] = $args;

                    return $this;
                }
            };
            foreach ($conditions as $condition) {
                $condition($query);
            }
            check($query->calls === [['tenant', '=', $value]], 'Scope became a reserved predicate');
        }
    }
});
witness('GHSA-6rv8-qj5v-p8ch signed numeric query encoding', function () use ($app) {
    $app['router']->get('/dependency-security-signed', fn () => 'unused')->name('dependency-security-signed');
    $app['router']->getRoutes()->refreshNameLookups();
    $app['url']->setRoutes($app['router']->getRoutes());
    $url = $app['url']->temporarySignedRoute('dependency-security-signed', now()->addMinute(), [0 => 'safe&expires=9999999999']);
    parse_str((string) parse_url($url, PHP_URL_QUERY), $query);
    check((int) $query['expires'] < 9999999999, 'Numeric parameter replaced signed expiry');
    check(str_contains($url, 'safe%26expires%3D9999999999'), 'Numeric parameter was not encoded');
});
witness('GHSA-9966-43cq-4mpr dynamic component escaping', function () {
    class_alias(DependencySecurityComponent::class, 'DependencySecurity\\FixtureComponent');
    Blade::component('DependencySecurity\\FixtureComponent', 'dependency-security-fixture-patched');
    $payload = '" onmouseover="unsafe';
    $rendered = Blade::render('<x-dynamic-component component="dependency-security-fixture-patched" :title="$payload" />', compact('payload'));
    check(! str_contains($rendered, 'title="" onmouseover='), 'Dynamic component attribute escaped its boundary');
    check(str_contains($rendered, '&quot;'), 'Expected escaped attribute absent');
});
witness('GHSA-5xc4-gpwg-p8wq compiled echo-format separation', function () use ($app) {
    $compiler = $app['blade.compiler'];
    $original = $compiler->getCompiledPath('/synthetic/security-mail.blade.php');
    try {
        $compiler->setEchoFormat('custom_secured_encoder(%s)');
        check($compiler->getCompiledPath('/synthetic/security-mail.blade.php') !== $original, 'Secured echo reused default cached view');
    } finally {
        $compiler->setEchoFormat(BladeCompiler::DEFAULT_ECHO_FORMAT);
    }
});
witness('CVE-2026-133743 untrusted forwarded fragment headers', function () {
    $proxies = Request::getTrustedProxies();
    $headers = Request::getTrustedHeaderSet();
    try {
        Request::setTrustedProxies(['10.0.0.1'], Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PROTO);
        $kernel = new class implements HttpKernelInterface
        {
            public function handle(Request $request, int $type = self::MAIN_REQUEST, bool $catch = true): Response
            {
                return new Response($request->getSchemeAndHttpHost());
            }
        };
        $request = Request::create('https://safe.example.test/', server: ['REMOTE_ADDR' => '198.51.100.1', 'HTTP_X_FORWARDED_HOST' => 'unsafe.example.test', 'HTTP_X_FORWARDED_PROTO' => 'http']);
        $response = (new InlineFragmentRenderer($kernel))->render('https://safe.example.test/fragment', $request);
        check($response->getContent() === 'https://safe.example.test', 'Fragment trusted attacker headers');
    } finally {
        Request::setTrustedProxies($proxies, $headers);
    }
});
witness('CVE-2026-133746 generated path authority', function () {
    $routes = new RouteCollection;
    $routes->add('path', new Route('/{path}', requirements: ['path' => '.+']));
    $generator = new UrlGenerator($routes, new RequestContext('', 'GET', 'safe.example.test', 'https'));
    $url = $generator->generate('path', ['path' => '/unsafe.example.test/path']);
    check(! str_starts_with($url, '//'), 'Generated path became network authority');
});
witness('CVE-2026-133754 host placeholder validation', function () {
    $routes = new RouteCollection;
    $routes->add('host', new Route('/', requirements: ['tenant' => '.+'], host: '{tenant}.example.test'));
    $generator = new UrlGenerator($routes, new RequestContext);
    foreach (['unsafe@example', 'unsafe/example', 'unsafe。example'] as $tenant) {
        try {
            $generator->generate('host', compact('tenant'));
        } catch (InvalidParameterException) {
            continue;
        }
        throw new RuntimeException('Unsafe host placeholder accepted');
    }
    check(str_contains($generator->generate('host', ['tenant' => 'safe']), 'safe.example.test'), 'Normal host rejected');
});
witness('CVE-2026-133751 required TLS survives EHLO failure', function () {
    $transport = new DependencySecuritySmtp;
    $transport->rejectEhlo = true;
    $transport->setRequireTls(true);
    try {
        $transport->executeCommand("HELO safe\r\n", [250]);
    } catch (TransportException $error) {
        check(str_contains($error->getMessage(), 'TLS required'), 'Unexpected TLS failure');

        return;
    }
    throw new RuntimeException('TLS requirement bypassed');
});
witness('CVE-2026-133755 STARTTLS rejects injected cleartext replies', function () {
    $transport = new DependencySecuritySmtp;
    try {
        $transport->executeCommand("HELO safe\r\n", [250]);
    } catch (TransportException $error) {
        check(str_contains($error->getMessage(), 'unexpected data'), 'Unexpected STARTTLS failure');
        check(! $transport->fixtureStream->handshake, 'Handshake began despite pending attacker data');

        return;
    }
    throw new RuntimeException('Injected STARTTLS data accepted');
});

exit($failures === [] ? 0 : 1);
