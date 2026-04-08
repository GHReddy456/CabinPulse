import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, runTransaction } from "firebase/database";
import { db } from "../lib/firebase";

const OPEN_HOUR_DAYS = ["TUE", "WED", "THU", "FRI", "SAT"] as const;

const DEFAULT_OPEN_HOURS: Record<string, Record<string, { am: string; pm: string }>> = {
  deepanjan: {
    TUE: { am: "10-11 AM", pm: "2-3 PM" },
    WED: { am: "9-10 AM", pm: "3-4 PM" },
    THU: { am: "9-10 AM", pm: "2-3 PM" },
    FRI: { am: "9-10 AM", pm: "2-3 PM" },
    SAT: { am: "9-10 AM", pm: "2-3 PM" },
  },
  mallelasivanagaraju: {
    TUE: { am: "11-12 AM", pm: "3-4 PM" },
    WED: { am: "9-10 AM", pm: "2-3 PM" },
    THU: { am: "9-10 AM", pm: "2-3 PM" },
    FRI: { am: "10-11 AM", pm: "2-3 PM" },
    SAT: { am: "9-10 AM", pm: "2-3 PM" },
  },
  inampudigovardhana: {
    TUE: { am: "9-10 AM", pm: "2-3 PM" },
    WED: { am: "10-11 AM", pm: "3-4 PM" },
    THU: { am: "9-10 AM", pm: "2-3 PM" },
    FRI: { am: "9-10 AM", pm: "2-3 PM" },
    SAT: { am: "9-10 AM", pm: "3-4 PM" },
  },
  killidurgabhavani: {
    TUE: { am: "9-10 AM", pm: "2-3 PM" },
    WED: { am: "9-10 AM", pm: "2-3 PM" },
    THU: { am: "9-10 AM", pm: "4-5 PM" },
    FRI: { am: "9-10 AM", pm: "2-3 PM" },
    SAT: { am: "9-10 AM", pm: "2-3 PM" },
  },
  asishkumardalai: {
    TUE: { am: "9-10 AM", pm: "2-3 PM" },
    WED: { am: "10-11 AM", pm: "2-3 PM" },
    THU: { am: "11-12 AM", pm: "2-3 PM" },
    FRI: { am: "9-10 AM", pm: "3-4 PM" },
    SAT: { am: "9-10 AM", pm: "2-3 PM" },
  },
  thangamshivanatham: {
    TUE: { am: "9-10 AM", pm: "2-3 PM" },
    WED: { am: "11-12 AM", pm: "2-3 PM" },
    THU: { am: "10-11 AM", pm: "2-3 PM" },
    FRI: { am: "9-10 AM", pm: "3-4 PM" },
    SAT: { am: "9-10 AM", pm: "2-3 PM" },
  },
  karthickm: {
    TUE: { am: "11-12 AM", pm: "4-5 PM" },
    WED: { am: "9-10 AM", pm: "3-4 PM" },
    THU: { am: "11-12 AM", pm: "2-3 PM" },
    FRI: { am: "10-11 AM", pm: "3-4 PM" },
    SAT: { am: "11-12 AM", pm: "3-4 PM" },
  },
  anuragde: {
    TUE: { am: "9-10 AM", pm: "3-4 PM" },
    WED: { am: "9-10 AM", pm: "2-3 PM" },
    THU: { am: "9-10 AM", pm: "2-3 PM" },
    FRI: { am: "10-11 AM", pm: "4-5 PM" },
    SAT: { am: "9-10 AM", pm: "2-3 PM" },
  },
  pamulapatiashokreddy: {
    TUE: { am: "10-11 AM", pm: "2-3 PM" },
    WED: { am: "9-10 AM", pm: "2-3 PM" },
    THU: { am: "9-10 AM", pm: "3-4 PM" },
    FRI: { am: "11-12 AM", pm: "3-4 PM" },
    SAT: { am: "9-10 AM", pm: "2-3 PM" },
  },
};

const normalizeSlotValue = (value: unknown, fallbackMeridian: "AM" | "PM") => {
  if (!value || String(value).trim().length === 0) return "N/A";
  const raw = String(value).trim();
  if (/^n\/a$/i.test(raw)) return "N/A";

  const withMeridian = raw.match(/^\s*(\d{1,2})(?::\d{2})?\s*-\s*(\d{1,2})(?::\d{2})?\s*(AM|PM)\s*$/i);
  if (withMeridian) {
    const startHour = parseInt(withMeridian[1], 10);
    const endHour = parseInt(withMeridian[2], 10);
    const meridian = withMeridian[3].toUpperCase();
    if (!Number.isNaN(startHour) && !Number.isNaN(endHour)) return `${startHour}-${endHour} ${meridian}`;
  }

  const hourRange = raw.match(/^\s*(\d{1,2})(?::\d{2})?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*$/);
  if (hourRange) {
    const startHour = parseInt(hourRange[1], 10);
    let endHour = parseInt(hourRange[2], 10);
    const endMinute = hourRange[3] ? parseInt(hourRange[3], 10) : 0;
    if (endMinute >= 50) endHour += 1;
    if (!Number.isNaN(startHour) && !Number.isNaN(endHour)) return `${startHour}-${endHour} ${fallbackMeridian}`;
  }

  return raw.toUpperCase();
};

const normalizeSchedule = (schedule: any) => {
  const next: Record<string, { am: string; pm: string }> = {};
  OPEN_HOUR_DAYS.forEach((day) => {
    const dayData = schedule?.[day] || {};
    next[day] = {
      am: normalizeSlotValue(dayData.am, "AM"),
      pm: normalizeSlotValue(dayData.pm, "PM"),
    };
  });
  return next;
};

export function useFirebaseData() {
  const [faculty, setFaculty] = useState({});
  const [config, setConfig] = useState({});
  const [subsCount, setSubsCount] = useState({});
  const [openHours, setOpenHours] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const facultyRef = ref(db, "faculty");
    const configRef = ref(db, "facultyConfig");
    const subsCountRef = ref(db, "subsCount");
    const openHoursRef = ref(db, "openHours");

    let facultyLoaded = false;
    let configLoaded = false;

    const unsubFaculty = onValue(facultyRef, (snapshot) => {
      setFaculty(snapshot.val() || {});
      facultyLoaded = true;
      if (configLoaded) setLoading(false);
    });

    const unsubConfig = onValue(configRef, (snapshot) => {
      setConfig(snapshot.val() || {});
      configLoaded = true;
      if (facultyLoaded) setLoading(false);
    });

    const unsubSubsCount = onValue(subsCountRef, (snapshot) => {
      setSubsCount(snapshot.val() || {});
    });

    const unsubOpenHours = onValue(openHoursRef, async (snapshot) => {
      const data = snapshot.val() || {};
      const merged: Record<string, any> = { ...data };

      Object.entries(DEFAULT_OPEN_HOURS).forEach(([key, schedule]) => {
        if (!merged[key]) merged[key] = schedule;
      });

      const normalized: Record<string, any> = {};
      Object.entries(merged).forEach(([key, schedule]) => {
        normalized[key] = normalizeSchedule(schedule);
      });

      setOpenHours(normalized);

      const writes = Object.entries(normalized)
        .filter(([key, schedule]) => JSON.stringify(data[key] || null) !== JSON.stringify(schedule))
        .map(([key, schedule]) => set(ref(db, `openHours/${key}`), schedule));

      if (writes.length > 0) await Promise.all(writes);
    });

    return () => {
      unsubFaculty();
      unsubConfig();
      unsubSubsCount();
      unsubOpenHours();
    };
  }, []);

  const subscribeToFaculty = useCallback(async (cabinId) => {
    const studentId = Math.random().toString(36).substring(7);
    const subRef = ref(db, `studentSubs/${cabinId}/${studentId}`);
    const countRef = ref(db, `subsCount/${cabinId}`);
    try {
      await set(subRef, true);
      await runTransaction(countRef, (current) => (current || 0) + 1);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const unsubscribeFromFaculty = useCallback(async (cabinId) => {
    const countRef = ref(db, `subsCount/${cabinId}`);
    try {
      await runTransaction(countRef, (current) => {
        const val = (current || 0) - 1;
        return val < 0 ? 0 : val;
      });
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  return { faculty, config, subsCount, openHours, loading, subscribeToFaculty, unsubscribeFromFaculty };
}
