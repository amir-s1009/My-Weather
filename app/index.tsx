import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { Droplet, RefreshCcw, SatelliteDish, Wind } from "lucide-react-native";
import { fetchWeatherApi } from "openmeteo";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const url = "https://api.open-meteo.com/v1/forecast";

export default function HomeScreen() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchResult, setSearchResult] = useState<
    { country: string; province: string; city: string }[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [granting, setGranting] = useState(false);
  const [weatherData, setWeatherData] = useState<{
    weather_code: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
  } | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [address, setAddress] = useState<{
    city: string;
    country: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!location) return;
      const responses = await fetchWeatherApi(url, {
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
        current: [
          "weather_code",
          "temperature_2m",
          "relative_humidity_2m",
          "wind_speed_10m",
        ],
      });
      const response = responses[0];
      const current = response.current()!;

      const weatherData = {
        weather_code: current.variables(0)!.value(),
        temperature_2m: current.variables(1)!.value(),
        relative_humidity_2m: current.variables(2)!.value(),
        wind_speed_10m: current.variables(3)!.value(),
      };

      setWeatherData(weatherData);
      setRefreshing(false);
    }
    fetchData();
  }, [location, refreshing]);

  const grantLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied :(");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setErrorMsg(null);
    } catch {
      setErrorMsg("Permission to access location was denied :(");
    }
  };

  useEffect(() => {
    async function getCurrentLocationAndAddress() {
      await grantLocationPermission();
      try {
        const geoCodeArray = await Location.reverseGeocodeAsync({
          latitude: location!.coords.latitude,
          longitude: location!.coords.longitude,
        });
        const geoCode = geoCodeArray[0];
        if (geoCode && geoCode.city && geoCode.country)
          setAddress({ city: geoCode.city, country: geoCode.country });
        setAddress(null);
      } catch {
        setAddress(null);
      } finally {
        setRefreshing(false);
      }
    }
    getCurrentLocationAndAddress();
  }, [refreshing, location]);

  const calcWeatherStatus = (code: number | undefined) => {
    if (code === 0) return "CLEAR";
    if (code === 1 || code === 2 || code === 3) return "PARTLY_CLOUDY";
    if (code === 45 || code === 48) return "FOGGY";
    if (
      code === 61 ||
      code === 63 ||
      code === 65 ||
      code === 66 ||
      code === 67 ||
      code === 80 ||
      code === 81 ||
      code === 82
    )
      return "RAINY";
    if (
      code === 71 ||
      code === 73 ||
      code === 75 ||
      code === 77 ||
      code === 85 ||
      code === 86
    )
      return "SNOWY";
    return undefined;
  };

  if (!location && !errorMsg)
    return (
      <View className="flex-1 w-full flex flex-col justify-center gap-8 items-center bg-pink-300">
        <SatelliteDish size={80} color="white" />
        <Text className="text-white font-semibold text-2xl text-center">
          Waiting for your location...
        </Text>
      </View>
    );

  if (errorMsg)
    return (
      <>
      {granting && <View className="flex-1 w-full flex flex-col justify-center items-center bg-green-200">
        <Text className="text-green-700 font-semibold tracking-wider text-2xl">Granting your permission...</Text>
        </View>}
        {!granting && <View className="flex-1 w-full flex flex-col justify-center gap-10 items-center bg-red-900">
          <StatusBar style="light" />
          <Text className="text-white font-bold text-4xl tracking-widest">
            Oops!
          </Text>
          <Text className="text-white font-light text-xl/[35px] tracking-wider text-center px-8">
            {errorMsg}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              setGranting(true);
              await grantLocationPermission();
              setGranting(false);
            }}
            className="bg-white/80 rounded-xl p-4"
          >
            <Text className="text-xl font-medium text-red-600">Try again!</Text>
          </TouchableOpacity>
        </View>}
      </>
    );

  const weatherStatus = calcWeatherStatus(weatherData?.weather_code);
  return (
    <SafeAreaView className="flex-1">
      <View className="flex flex-1 flex-col justify-around items-center">
        <Image
          blurRadius={80}
          source={require("../assets/images/bg.jpg")}
          className="absolute w-full h-full z-0"
        />
        <View className="flex-1 flex flex-col justify-between items-center w-full px-5 py-8 z-1">
          <View className="relative">
            <View
              className={`w-full h-14 flex flex-row items-center px-0 rounded-full justify-between transition-all duration-300 ease-linear ${showSearch ? "bg-white/30" : "bg-transparent delay-200"}`}
            >
              <TextInput
                className={`h-full ml-4 text-lg transition-all duration-300 ease-linear ${showSearch ? "opacity-100 delay-200" : "opacity-0"}`}
                placeholder="Search City..."
                placeholderTextColor={"white"}
                editable={showSearch}
              />
              <TouchableOpacity
                onPress={() => {}}
                disabled={true}
                className="flex justify-center items-center bg-white/20 h-full aspect-square rounded-full"
              >
                <Ionicons name="search" size={25} color="#00000030" />
              </TouchableOpacity>
            </View>

            {showSearch && searchResult.length > 0 && (
              <ScrollView
                contentContainerClassName="flex flex-col justify-start gap-5 items-start pb-12"
                className="absolute top-[100%] z-50 mt-3 w-full max-h-[200px] p-5 bg-white/75 rounded-[15px]"
              >
                {searchResult.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    className="flex flex-row justify-start gap-0 items-center"
                  >
                    <Ionicons name="location" size={25} color="red" />
                    <View className="flex flex-row justify-start gap-5 items-center">
                      <Text className="font-bold text-neutral-600 text-lg">
                        {item.city}, {item.province}
                      </Text>
                      <Text className="font-normal text-sm">
                        {item.country}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View className="flex flex-col justify-center gap-2 items-center">
            <View className="relative flex flex-row justify-center gap-2 items-center">
              <Ionicons
                className="absolute -left-8"
                name="location"
                color="red"
                size={25}
              />
              <Text className="text-[25px] font-extrabold text-white tracking-wider line-clamp-1">
                {refreshing
                  ? "Reloading"
                  : address
                    ? address.city
                    : "Unknown City"}
              </Text>
            </View>
            <Text className="text-[18px] font-normal text-white">
              {refreshing
                ? "Reloading..."
                : address
                  ? address.country
                  : "Unknown Country"}
            </Text>
          </View>

          <TouchableOpacity
            disabled={refreshing}
            onPress={() => {
              setRefreshing(true);
            }}
            className="p-10 z-[1]"
          >
            <RefreshCcw size={30} />
          </TouchableOpacity>

          <View className="w-[50%] aspect-[16/2] flex justify-center items-center">
            {refreshing ? (
              <Text>Reloading...</Text>
            ) : (
              weatherStatus && (
                <Image
                  source={
                    weatherStatus === "CLEAR"
                      ? require(`../assets/icons/sunny.png`)
                      : weatherStatus === "PARTLY_CLOUDY"
                        ? require("../assets/icons/partly-cloudy.png")
                        : weatherStatus === "RAINY"
                          ? require("../assets/icons/rainy.png")
                          : weatherStatus === "SNOWY"
                            ? require("../assets/icons/cloudy.png")
                            : undefined
                  }
                  className="w-full"
                  resizeMode="contain"
                />
              )
            )}
          </View>

          <View className="flex flex-col justify-center gap-3 items-center">
            <Text className="text-[55px] font-bold text-white">
              {refreshing
                ? "Reloading"
                : Math.floor(weatherData?.temperature_2m ?? 0)}
              &#176;
            </Text>
            <Text className="text-white font-medium text-[20px]">
              {refreshing
                ? "Reloaing"
                : weatherStatus === "CLEAR"
                  ? "Clear"
                  : weatherStatus === "FOGGY"
                    ? "Foggy"
                    : weatherStatus === "PARTLY_CLOUDY"
                      ? "Partly Cloudy"
                      : weatherStatus === "RAINY"
                        ? "Rainy"
                        : weatherStatus === "SNOWY"
                          ? "Snowy"
                          : "Unknown"}
            </Text>
          </View>
          <View></View>
          <View className="w-full px-5 flex flex-row justify-center gap-8 items-center">
            <View className="flex flex-row justify-start gap-2 items-center">
              <Wind color="darkgray" />
              <Text className="text-neutral-600">
                {refreshing
                  ? "Reloading"
                  : Math.floor(weatherData?.wind_speed_10m ?? 0) + " km/h"}
              </Text>
            </View>
            <View className="flex flex-row justify-start gap-2 items-center">
              <Droplet color="skyblue" />
              <Text className="text-cyan-600">
                {refreshing ? "Reloading" : weatherData?.relative_humidity_2m} %
              </Text>
            </View>
            {/* <View className="flex flex-row justify-start gap-2 items-center">
              <LucideSunrise color="orange" />
              <Text className="text-orange-500">05:57</Text>
            </View> */}
          </View>
          <View></View>
        </View>
      </View>
    </SafeAreaView>
  );
}
