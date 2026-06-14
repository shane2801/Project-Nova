export type SlotState = "available" | "booked" | "past" | "live";

export type Slot = {
  hour: number;
  startAt: Date;
  endAt: Date;
  state: SlotState;
  bookedBy?: string;
};

export const SLOT_START_HOUR = 8;
export const SLOT_END_HOUR = 22;

const IN_USE_STATUSES = ["Charging", "Preparing", "Finishing", "SuspendedEVSE", "SuspendedEV"];

type BookingForSlots = {
  startAt: Date | string;
  endAt: Date | string;
  status: string;
  connectorId?: number;
  user?: { name: string };
};

export function computeSlots(opts: {
  now: Date;
  bookings: BookingForSlots[];
  stationIdentity: string;
  connectorId?: number;
  connectorStatus?: string;
}): Slot[] {
  const { now, connectorStatus, connectorId } = opts;
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Filter to only bookings on the selected connector (if any)
  const relevantBookings = opts.bookings
    .filter((b) => ["reserved", "active"].includes(b.status))
    .filter((b) => connectorId == null || b.connectorId == null || b.connectorId === connectorId)
    .map((b) => ({
      ...b,
      startAt: new Date(b.startAt),
      endAt: new Date(b.endAt),
    }));

  const chargerIsInUseNow = connectorStatus
    ? IN_USE_STATUSES.includes(connectorStatus)
    : false;

  const slots: Slot[] = [];
  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
    const slotStart = new Date(startOfDay);
    slotStart.setHours(h, 0, 0, 0);
    const slotEnd = new Date(startOfDay);
    slotEnd.setHours(h + 1, 0, 0, 0);

    const booking = relevantBookings.find(
      (b) => b.startAt.getTime() === slotStart.getTime()
    );

    const slotIsNow = now >= slotStart && now < slotEnd;

    let state: SlotState;
    let bookedBy: string | undefined;

    if (booking) {
      const isLive = now >= booking.startAt && now < booking.endAt;
      state = isLive ? "live" : "booked";
      bookedBy = booking.user?.name;
    } else if (slotIsNow && chargerIsInUseNow) {
      state = "live";
    } else if (slotEnd <= now) {
      state = "past";
    } else {
      state = "available";
    }

    slots.push({ hour: h, startAt: slotStart, endAt: slotEnd, state, bookedBy });
  }

  return slots;
}

export function todayBookingsWhereClause(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startAt: { gte: start, lt: end } };
}