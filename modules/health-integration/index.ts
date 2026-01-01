import { Platform } from "react-native";

let AppleHealthKit: any = null;
let HealthConnect: any = null;

const dataCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL_MS = 60000;

function getCached(key: string): any | null {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  dataCache.set(key, { data, timestamp: Date.now() });
}

function loadHealthLibraries() {
  if (Platform.OS === "ios") {
    try {
      const healthKitModule = require("@kingstinct/react-native-healthkit");
      AppleHealthKit = healthKitModule.default || healthKitModule;
    } catch (e) {
    }
  } else if (Platform.OS === "android") {
    try {
      HealthConnect = require("react-native-health-connect");
    } catch (e) {
    }
  }
}

loadHealthLibraries();

export interface HealthData {
  steps: number;
  activeCalories: number;
  basalCalories: number;
  totalCalories: number;
  distance: number;
  flightsClimbed: number;
  date: string;
  lastUpdated: string;
}

export async function isHealthAvailable(): Promise<boolean> {
  try {
    if (Platform.OS === "ios") return !!AppleHealthKit;
    if (Platform.OS === "android") {
      if (!HealthConnect) return false;
      return await HealthConnect.isHealthConnectAvailable();
    }
    return false;
  } catch {
    return false;
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === "ios") {
      if (!AppleHealthKit) throw new Error("AppleHealthKit not available");
      
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.FlightsClimbed,
          ],
          write: [],
        },
      };

      return new Promise((resolve, reject) => {
        AppleHealthKit.initHealthKit(permissions, (error: any) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(true);
        });
      });
    } else if (Platform.OS === "android") {
      if (!HealthConnect) throw new Error("HealthConnect not available");
      
      const permissions = [
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "ActiveCaloriesBurned" },
        { accessType: "read", recordType: "TotalCaloriesBurned" },
        { accessType: "read", recordType: "Distance" },
        { accessType: "read", recordType: "FloorsClimbed" },
      ];
      
      return await HealthConnect.requestPermission(permissions);
    }
    return false;
  } catch {
    return false;
  }
}

export async function getAuthorizationStatus(): Promise<"authorized" | "denied" | "notDetermined"> {
  try {
    if (Platform.OS === "ios") {
      if (!AppleHealthKit) return "notDetermined";
      
      return new Promise((resolve) => {
        try {
          AppleHealthKit.getAuthStatus(
            AppleHealthKit.Constants.Permissions.Steps,
            (error: any, result: any) => {
              if (error) return resolve("notDetermined");
              if (result === 2) return resolve("authorized");
              if (result === 1) return resolve("denied");
              resolve("notDetermined");
            }
          );
        } catch {
          resolve("notDetermined");
        }
      });
    } else if (Platform.OS === "android") {
      if (!HealthConnect) return "notDetermined";
      const hasPermission = await HealthConnect.hasPermission([
        { accessType: "read", recordType: "Steps" },
      ]);
      return hasPermission ? "authorized" : "notDetermined";
    }
    return "notDetermined";
  } catch {
    return "notDetermined";
  }
}

export async function getStepsForDate(dateString: string): Promise<number> {
  const cacheKey = `steps_${dateString}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    if (Platform.OS === "ios" && AppleHealthKit) {
      return new Promise((resolve) => {
        AppleHealthKit.getDailyStepCountSamples(
          { date: new Date(dateString).toISOString(), unit: "count" },
          (error: any, results: any[]) => {
            if (error || !results?.length) return resolve(0);
            const total = results.reduce((sum, s) => sum + (s.value || 0), 0);
            setCache(cacheKey, Math.round(total));
            resolve(Math.round(total));
          }
        );
      });
    } else if (Platform.OS === "android" && HealthConnect) {
      const date = new Date(dateString);
      const startDate = new Date(date.setHours(0, 0, 0, 0));
      const endDate = new Date(date.setHours(23, 59, 59, 999));
      
      const records = await HealthConnect.readRecords("Steps", {
        timeRangeFilter: { operator: "between", startTime: startDate.toISOString(), endTime: endDate.toISOString() },
      });
      
      const total = records.reduce((sum: number, r: any) => sum + (r.count || 0), 0);
      setCache(cacheKey, Math.round(total));
      return Math.round(total);
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function getActiveCaloriesForDate(dateString: string): Promise<number> {
  const cacheKey = `active_cal_${dateString}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    if (Platform.OS === "ios" && AppleHealthKit) {
      return new Promise((resolve) => {
        AppleHealthKit.getActiveEnergyBurned(
          { date: new Date(dateString).toISOString(), unit: "kilocalorie" },
          (error: any, results: any[]) => {
            if (error || !results?.length) return resolve(0);
            const total = results.reduce((sum, s) => sum + (s.value || 0), 0);
            setCache(cacheKey, Math.round(total));
            resolve(Math.round(total));
          }
        );
      });
    } else if (Platform.OS === "android" && HealthConnect) {
      const date = new Date(dateString);
      const startDate = new Date(date.setHours(0, 0, 0, 0));
      const endDate = new Date(date.setHours(23, 59, 59, 999));
      
      const records = await HealthConnect.readRecords("ActiveCaloriesBurned", {
        timeRangeFilter: { operator: "between", startTime: startDate.toISOString(), endTime: endDate.toISOString() },
      });
      
      const total = records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories || 0), 0);
      setCache(cacheKey, Math.round(total));
      return Math.round(total);
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function getBasalCaloriesForDate(dateString: string): Promise<number> {
  const cacheKey = `basal_cal_${dateString}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    if (Platform.OS === "ios" && AppleHealthKit) {
      return new Promise((resolve) => {
        AppleHealthKit.getBasalEnergyBurned(
          { date: new Date(dateString).toISOString(), unit: "kilocalorie" },
          (error: any, results: any[]) => {
            if (error || !results?.length) return resolve(0);
            const total = results.reduce((sum, s) => sum + (s.value || 0), 0);
            setCache(cacheKey, Math.round(total));
            resolve(Math.round(total));
          }
        );
      });
    } else if (Platform.OS === "android" && HealthConnect) {
      const date = new Date(dateString);
      const startDate = new Date(date.setHours(0, 0, 0, 0));
      const endDate = new Date(date.setHours(23, 59, 59, 999));
      
      const [totalRec, activeRec] = await Promise.all([
        HealthConnect.readRecords("TotalCaloriesBurned", {
          timeRangeFilter: { operator: "between", startTime: startDate.toISOString(), endTime: endDate.toISOString() },
        }),
        HealthConnect.readRecords("ActiveCaloriesBurned", {
          timeRangeFilter: { operator: "between", startTime: startDate.toISOString(), endTime: endDate.toISOString() },
        }),
      ]);
      
      const totalCal = totalRec.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories || 0), 0);
      const activeCal = activeRec.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories || 0), 0);
      const basal = Math.max(0, totalCal - activeCal);
      setCache(cacheKey, Math.round(basal));
      return Math.round(basal);
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function getDistanceForDate(dateString: string): Promise<number> {
  const cacheKey = `distance_${dateString}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    if (Platform.OS === "ios" && AppleHealthKit) {
      return new Promise((resolve) => {
        AppleHealthKit.getDistanceWalkingRunning(
          { date: new Date(dateString).toISOString(), unit: "meter" },
          (error: any, results: any[]) => {
            if (error || !results?.length) return resolve(0);
            const total = results.reduce((sum, s) => sum + (s.value || 0), 0);
            setCache(cacheKey, Math.round(total));
            resolve(Math.round(total));
          }
        );
      });
    } else if (Platform.OS === "android" && HealthConnect) {
      const date = new Date(dateString);
      const startDate = new Date(date.setHours(0, 0, 0, 0));
      const endDate = new Date(date.setHours(23, 59, 59, 999));
      
      const records = await HealthConnect.readRecords("Distance", {
        timeRangeFilter: { operator: "between", startTime: startDate.toISOString(), endTime: endDate.toISOString() },
      });
      
      const total = records.reduce((sum: number, r: any) => sum + (r.distance?.inMeters || 0), 0);
      setCache(cacheKey, Math.round(total));
      return Math.round(total);
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function getFlightsClimbedForDate(dateString: string): Promise<number> {
  const cacheKey = `flights_${dateString}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    if (Platform.OS === "ios" && AppleHealthKit) {
      return new Promise((resolve) => {
        AppleHealthKit.getFlightsClimbed(
          { date: new Date(dateString).toISOString(), unit: "count" },
          (error: any, results: any[]) => {
            if (error || !results?.length) return resolve(0);
            const total = results.reduce((sum, s) => sum + (s.value || 0), 0);
            setCache(cacheKey, Math.round(total));
            resolve(Math.round(total));
          }
        );
      });
    } else if (Platform.OS === "android" && HealthConnect) {
      const date = new Date(dateString);
      const startDate = new Date(date.setHours(0, 0, 0, 0));
      const endDate = new Date(date.setHours(23, 59, 59, 999));
      
      const records = await HealthConnect.readRecords("FloorsClimbed", {
        timeRangeFilter: { operator: "between", startTime: startDate.toISOString(), endTime: endDate.toISOString() },
      });
      
      const total = records.reduce((sum: number, r: any) => sum + (r.floors || 0), 0);
      setCache(cacheKey, Math.round(total));
      return Math.round(total);
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function getHealthDataForDate(dateString: string): Promise<HealthData> {
  const emptyData: HealthData = {
    steps: 0, activeCalories: 0, basalCalories: 0, totalCalories: 0,
    distance: 0, flightsClimbed: 0, date: dateString, lastUpdated: new Date().toISOString(),
  };

  if ((Platform.OS === "ios" && !AppleHealthKit) || (Platform.OS === "android" && !HealthConnect)) {
    return emptyData;
  }

  try {
    const [steps, activeCalories, basalCalories, distance, flights] = await Promise.all([
      getStepsForDate(dateString),
      getActiveCaloriesForDate(dateString),
      getBasalCaloriesForDate(dateString),
      getDistanceForDate(dateString),
      getFlightsClimbedForDate(dateString),
    ]);

    return {
      steps, activeCalories, basalCalories,
      totalCalories: activeCalories + basalCalories,
      distance, flightsClimbed: flights,
      date: dateString, lastUpdated: new Date().toISOString(),
    };
  } catch {
    return emptyData;
  }
}

export default {
  isHealthAvailable, requestHealthPermissions, getAuthorizationStatus,
  getStepsForDate, getActiveCaloriesForDate, getBasalCaloriesForDate,
  getDistanceForDate, getFlightsClimbedForDate, getHealthDataForDate,
};
