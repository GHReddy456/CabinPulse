import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    databaseURL: "https://faculty-availability-tra-180eb-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "faculty-availability-tra-180eb",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
