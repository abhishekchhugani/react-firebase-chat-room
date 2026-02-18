import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  appId: "1:569417148410:web:6552eda85755430b8ba643",
  apiKey: "AIzaSyCavlf68ZM5eYEOHEbyiEgHbaCnuaeUX_0",
  authDomain: "unimonchat.firebaseapp.com",
  projectId: "unimonchat",
  databaseURL: "https://unimonchat-default-rtdb.asia-southeast1.firebasedatabase.app/",  // Your region
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getDatabase(app);

