import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, runTransaction } from "firebase/database";
import { db } from "../lib/firebase";

export function useFirebaseData() {
  const [faculty, setFaculty] = useState({});
  const [config, setConfig] = useState({});
  const [subsCount, setSubsCount] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const facultyRef = ref(db, "faculty");
    const configRef = ref(db, "facultyConfig");
    const subsCountRef = ref(db, "subsCount");

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

    return () => {
      unsubFaculty();
      unsubConfig();
      unsubSubsCount();
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

  return { faculty, config, subsCount, loading, subscribeToFaculty, unsubscribeFromFaculty };
}
