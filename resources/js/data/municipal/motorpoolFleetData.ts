export type FleetReadiness =
    | 'Available'
    | 'Scheduled'
    | 'In service reference'
    | 'Maintenance attention';

export type TripState =
    | 'Scheduled reference'
    | 'In service reference'
    | 'Completed reference'
    | 'Awaiting vehicle reference';

export type MaintenanceState =
    | 'Current reference'
    | 'Inspection attention'
    | 'Service attention'
    | 'Maintenance reference';

export type FuelReferenceState =
    | 'Reference current'
    | 'Review reference'
    | 'Refill reference';

export type FleetHistoryEvent = {
    label: string;
    detail: string;
};

export type FleetVehicle = {
    id: string;
    type: string;
    office: string;
    useContext: string;
    readiness: FleetReadiness;
    tripStatus: string;
    maintenanceState: MaintenanceState;
    maintenanceReference: string;
    lastServiceContext: string;
    nextAttention: string;
    fuelReferenceState: FuelReferenceState;
    fuelReference: string;
    recentMovement: string;
    history: FleetHistoryEvent[];
};

export type FleetTrip = {
    id: string;
    vehicleId: string;
    vehicleLabel: string;
    destinationContext: string;
    schedule: string;
    requestingOffice: string;
    state: TripState;
};

export const fleetVehicles: FleetVehicle[] = [
    {
        id: 'FLT-2026-001',
        type: 'Utility service vehicle',
        office: 'General Services Office',
        useContext: 'Municipal service support reference',
        readiness: 'Available',
        tripStatus: 'No active trip reference',
        maintenanceState: 'Current reference',
        maintenanceReference: 'Routine inspection reference current',
        lastServiceContext: 'Preventive-service reference reviewed',
        nextAttention: 'Routine condition review',
        fuelReferenceState: 'Reference current',
        fuelReference: 'Fuel reference reviewed for presentation',
        recentMovement: 'Returned to available fleet reference',
        history: [
            { label: 'Fleet reference opened', detail: 'Illustrative utility vehicle added without plate, driver or tracking data.' },
            { label: 'Service context reviewed', detail: 'Routine preventive-service reference remains current.' },
            { label: 'Readiness updated', detail: 'Vehicle is shown as Available for presentation planning.' },
        ],
    },
    {
        id: 'FLT-2026-002',
        type: 'Personnel transport reference',
        office: 'Administrative Services',
        useContext: 'Inter-office transport support',
        readiness: 'Scheduled',
        tripStatus: 'TRP-2026-041 · scheduled reference',
        maintenanceState: 'Current reference',
        maintenanceReference: 'Condition reference current',
        lastServiceContext: 'General condition reference reviewed',
        nextAttention: 'Post-trip condition reference',
        fuelReferenceState: 'Reference current',
        fuelReference: 'Trip fuel reference prepared',
        recentMovement: 'Reserved for scheduled municipal trip reference',
        history: [
            { label: 'Vehicle schedule referenced', detail: 'Administrative transport use placed in the illustrative schedule.' },
            { label: 'Readiness confirmed', detail: 'Vehicle remains Scheduled with current condition reference.' },
            { label: 'Fuel context noted', detail: 'Reference-only trip fuel context shown without transaction or consumption data.' },
        ],
    },
    {
        id: 'FLT-2026-003',
        type: 'Field inspection vehicle',
        office: 'Engineering Office',
        useContext: 'Engineering field coordination reference',
        readiness: 'In service reference',
        tripStatus: 'TRP-2026-042 · in service reference',
        maintenanceState: 'Current reference',
        maintenanceReference: 'Field-use condition reference current',
        lastServiceContext: 'Road-readiness reference reviewed',
        nextAttention: 'Return-condition reference',
        fuelReferenceState: 'Review reference',
        fuelReference: 'Fuel reference queued for post-trip review',
        recentMovement: 'Field-use reference currently active',
        history: [
            { label: 'Field-use reference scheduled', detail: 'Engineering field coordination recorded as presentation-only trip context.' },
            { label: 'Vehicle moved to in-service reference', detail: 'No GPS, driver identity or live dispatch is represented.' },
            { label: 'Post-trip review queued', detail: 'Condition and fuel references remain review-only presentation context.' },
        ],
    },
    {
        id: 'FLT-2026-004',
        type: 'Heavy utility vehicle',
        office: 'Operations reference',
        useContext: 'Municipal operations support reference',
        readiness: 'Maintenance attention',
        tripStatus: 'Unavailable for scheduling reference',
        maintenanceState: 'Service attention',
        maintenanceReference: 'Service attention reference open',
        lastServiceContext: 'Inspection reference identified follow-up',
        nextAttention: 'Service-condition review required',
        fuelReferenceState: 'Review reference',
        fuelReference: 'Fuel reference held for review context',
        recentMovement: 'Removed from scheduling reference for service attention',
        history: [
            { label: 'Condition attention noted', detail: 'Illustrative inspection context identified service attention.' },
            { label: 'Scheduling reference paused', detail: 'Vehicle is not presented as available while maintenance attention is open.' },
            { label: 'Maintenance context retained', detail: 'No work order, authorization or repair transaction is created.' },
        ],
    },
    {
        id: 'FLT-2026-005',
        type: 'Community service vehicle',
        office: 'Social Welfare Office',
        useContext: 'Community program support reference',
        readiness: 'Scheduled',
        tripStatus: 'TRP-2026-043 · scheduled reference',
        maintenanceState: 'Inspection attention',
        maintenanceReference: 'Pre-trip inspection reference pending',
        lastServiceContext: 'Routine service context current',
        nextAttention: 'Pre-trip inspection reference',
        fuelReferenceState: 'Refill reference',
        fuelReference: 'Refill reference noted without transaction data',
        recentMovement: 'Scheduled pending pre-trip inspection reference',
        history: [
            { label: 'Community support reference created', detail: 'Generic municipal support trip added without beneficiary or driver identity.' },
            { label: 'Pre-trip inspection flagged', detail: 'Inspection reference must be reviewed before the illustrative trip state advances.' },
            { label: 'Fuel reference noted', detail: 'Refill reference is contextual only and does not represent a fuel ledger transaction.' },
        ],
    },
    {
        id: 'FLT-2026-006',
        type: 'Support van reference',
        office: 'General Services Office',
        useContext: 'Shared municipal logistics reference',
        readiness: 'Available',
        tripStatus: 'Open for scheduling reference',
        maintenanceState: 'Maintenance reference',
        maintenanceReference: 'Minor maintenance reference monitored',
        lastServiceContext: 'Condition reference remains serviceable',
        nextAttention: 'Minor maintenance follow-up reference',
        fuelReferenceState: 'Reference current',
        fuelReference: 'Fuel reference current for presentation',
        recentMovement: 'Available with maintenance follow-up reference',
        history: [
            { label: 'Shared-use reference retained', detail: 'Support van remains available within this illustrative fleet board.' },
            { label: 'Maintenance follow-up noted', detail: 'Minor maintenance reference is visible without creating a work order.' },
            { label: 'Scheduling state confirmed', detail: 'Vehicle remains open for reference scheduling.' },
        ],
    },
];

export const fleetTrips: FleetTrip[] = [
    {
        id: 'TRP-2026-041',
        vehicleId: 'FLT-2026-002',
        vehicleLabel: 'Personnel transport reference',
        destinationContext: 'Municipal facility coordination',
        schedule: 'Today reference · 08:30–10:00',
        requestingOffice: 'Administrative Services',
        state: 'Scheduled reference',
    },
    {
        id: 'TRP-2026-042',
        vehicleId: 'FLT-2026-003',
        vehicleLabel: 'Field inspection vehicle',
        destinationContext: 'Engineering field coordination',
        schedule: 'Today reference · 09:00–12:00',
        requestingOffice: 'Engineering Office',
        state: 'In service reference',
    },
    {
        id: 'TRP-2026-043',
        vehicleId: 'FLT-2026-005',
        vehicleLabel: 'Community service vehicle',
        destinationContext: 'Barangay service support reference',
        schedule: 'Today reference · 13:30–16:00',
        requestingOffice: 'Social Welfare Office',
        state: 'Awaiting vehicle reference',
    },
    {
        id: 'TRP-2026-044',
        vehicleId: 'FLT-2026-001',
        vehicleLabel: 'Utility service vehicle',
        destinationContext: 'Municipal supply coordination',
        schedule: 'Upcoming reference · 08:00–10:30',
        requestingOffice: 'General Services Office',
        state: 'Scheduled reference',
    },
    {
        id: 'TRP-2026-045',
        vehicleId: 'FLT-2026-006',
        vehicleLabel: 'Support van reference',
        destinationContext: 'Inter-office logistics support',
        schedule: 'Upcoming reference · 14:00–15:30',
        requestingOffice: 'General Services Office',
        state: 'Scheduled reference',
    },
    {
        id: 'TRP-2026-040',
        vehicleId: 'FLT-2026-001',
        vehicleLabel: 'Utility service vehicle',
        destinationContext: 'Municipal operations support',
        schedule: 'Recent reference · completed',
        requestingOffice: 'Operations reference',
        state: 'Completed reference',
    },
];

export const fleetSummary = {
    fleetInView: fleetVehicles.length,
    available: fleetVehicles.filter((vehicle) => vehicle.readiness === 'Available').length,
    scheduled: fleetVehicles.filter((vehicle) => vehicle.readiness === 'Scheduled').length,
    maintenanceAttention: fleetVehicles.filter((vehicle) => vehicle.readiness === 'Maintenance attention').length,
};

export const readinessCounts: Array<{ readiness: FleetReadiness; count: number }> = [
    'Available',
    'Scheduled',
    'In service reference',
    'Maintenance attention',
].map((readiness) => ({
    readiness: readiness as FleetReadiness,
    count: fleetVehicles.filter((vehicle) => vehicle.readiness === readiness).length,
}));

export const todayTrips = fleetTrips.filter((trip) => trip.schedule.startsWith('Today reference'));
export const upcomingTrips = fleetTrips.filter((trip) => trip.schedule.startsWith('Upcoming reference'));
export const recentTrips = fleetTrips.filter((trip) => trip.state === 'Completed reference');
export const maintenanceAttentionVehicles = fleetVehicles.filter(
    (vehicle) => vehicle.maintenanceState === 'Service attention' || vehicle.maintenanceState === 'Inspection attention',
);
