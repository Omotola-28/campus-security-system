import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, Dimensions } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import MapView, { Marker } from 'react-native-maps';
import * as Notifications from 'expo-notifications';

// --- 1. Supabase Config ---
const SUPABASE_URL = 'https://ddcrnfojzuhogkuexboz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_secret_tqBpHryhF4ZTli629lhFZQ_gqJYn9J9';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Force notifications to show immediately even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [activeIncident, setActiveIncident] = useState(null);

  useEffect(() => {
    // Request permission for push notifications
    const requestPermissions = async () => {
      await Notifications.requestPermissionsAsync();
    };
    requestPermissions();

    console.log("Setting up Supabase Realtime Listener...");
    
    // --- 2. Listen to the Cloud for Alerts ---
    const channel = supabase
      .channel('public:incidents')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          console.log('🚨 NEW THREAT RECEIVED:', payload.new);
          
          // Wake up the phone with a loud notification
          Notifications.scheduleNotificationAsync({
            content: {
              title: "🚨 SECURITY ALERT 🚨",
              body: `Threat Detected: ${payload.new.threat_classification} (Confidence: ${payload.new.confidence_score.toFixed(2)})`,
              sound: 'default',
            },
            trigger: null, // trigger immediately
          });

          setActiveIncident({
            ...payload.new,
            latitude: 7.4444, 
            longitude: 3.9000,
            zone: "Kenneth Dike Library"
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 3. UI Rendering ---
  return (
    <View style={styles.container}>
      {!activeIncident ? (
        <View style={styles.standby}>
          <Text style={styles.statusText}>🟢 System Online</Text>
          <Text style={styles.subText}>Waiting for alerts...</Text>
        </View>
      ) : (
        <View style={styles.alertContainer}>
          <View style={styles.header}>
            <Text style={styles.alertTitle}>🚨 THREAT DETECTED 🚨</Text>
            <Text style={styles.alertDetails}>Location: {activeIncident.zone}</Text>
            <Text style={styles.alertDetails}>Type: {activeIncident.threat_classification}</Text>
          </View>
          
          <MapView 
            style={styles.map}
            initialRegion={{
              latitude: activeIncident.latitude,
              longitude: activeIncident.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker 
              coordinate={{ latitude: activeIncident.latitude, longitude: activeIncident.longitude }}
              title={activeIncident.threat_classification}
              description="Dispatch Immediately"
              pinColor="red"
            />
          </MapView>
          
          <Button 
            title="Acknowledge & Clear" 
            color="#d32f2f"
            onPress={() => setActiveIncident(null)} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  standby: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#4caf50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subText: {
    color: '#888',
    marginTop: 10,
  },
  alertContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#d32f2f',
    padding: 20,
    paddingTop: 50,
  },
  alertTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alertDetails: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
  },
});