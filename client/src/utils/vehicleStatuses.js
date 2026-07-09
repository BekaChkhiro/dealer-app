// Canonical vehicle statuses shared across Cars, CarDetail, Dashboard, etc.
// Keep in sync with the backend's vehicle status enum.

export const VEHICLE_STATUSES = [
  { value: 'purchased', labelKey: 'cars.statusPurchased' },
  { value: 'at_warehouse', labelKey: 'cars.statusAtWarehouse' },
  { value: 'to_load', labelKey: 'cars.statusToLoad' },
  { value: 'loaded', labelKey: 'cars.statusLoaded' },
  { value: 'in_transit', labelKey: 'cars.statusInTransit' },
  { value: 'arrived', labelKey: 'cars.statusArrived' },
  { value: 'delivered', labelKey: 'cars.statusDelivered' },
];

// Bootstrap-ish palette, one distinct color per status.
export const VEHICLE_STATUS_COLORS = {
  purchased: '#6c757d',
  at_warehouse: '#0dcaf0',
  to_load: '#ffc107',
  loaded: '#fd7e14',
  in_transit: '#17a2b8',
  arrived: '#28a745',
  delivered: '#20c997',
};

export function getVehicleStatusLabelKey(status) {
  return VEHICLE_STATUSES.find((s) => s.value === status)?.labelKey || null;
}

export function getVehicleStatusColor(status) {
  return VEHICLE_STATUS_COLORS[status] || '#6c757d';
}
