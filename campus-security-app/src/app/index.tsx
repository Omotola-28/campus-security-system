import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlinmryajtmebgbjhlgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4qVlWP9Lb0eRQZASi0DMCg_JfFY5j_B';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CAMPUS_ZONES = [
  { zone: 'Kenneth Dike Library, University of Ibadan', latitude: 7.4444, longitude: 3.9000 },
  { zone: 'UI Main Gate (First Gate), University of Ibadan', latitude: 7.4417, longitude: 3.9058 },
  { zone: 'Trenchard Hall, University of Ibadan', latitude: 7.4435, longitude: 3.8995 },
  { zone: 'Faculty of Science, University of Ibadan', latitude: 7.4468, longitude: 3.8960 },
  { zone: 'Sports Complex, University of Ibadan', latitude: 7.4455, longitude: 3.8975 },
  { zone: 'Kuti Hall, University of Ibadan', latitude: 7.4432, longitude: 3.8988 },
];

export default function SecurityDashboard() {
  const [activeIncident, setActiveIncident] = useState<any>(null);

  useEffect(() => {
    let lastId: any = null;
    let isFirstLoad = true;

    const checkIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase fetch error:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const latest = data[0];
        if (isFirstLoad) {
          lastId = latest.id;
          isFirstLoad = false;
        } else if (latest.id !== lastId) {
          lastId = latest.id;
          const randomZone = CAMPUS_ZONES[Math.floor(Math.random() * CAMPUS_ZONES.length)];
          setActiveIncident({
            ...latest,
            latitude: randomZone.latitude,
            longitude: randomZone.longitude,
            zone: randomZone.zone,
          });
        }
      } else {
        isFirstLoad = false;
      }
    };

    checkIncidents();
    const interval = setInterval(checkIncidents, 2000);
    return () => clearInterval(interval);
  }, []);

  const simulateThreat = async () => {
    const { error } = await supabase.from('incidents').insert([
      {
        node_id: 'bb8c6be8-2530-4e9a-8992-d36f0e577f6e',
        threat_classification: 'Simulated_Weapon',
        confidence_score: 0.89,
      },
    ]);
    if (error) console.error('Simulation error:', error.message);
  };

  if (!activeIncident) {
    return (
      <View style={styles.standby}>
        <Text style={styles.statusText}>🟢 System Online</Text>
        <Text style={styles.subText}>Monitoring Edge AI Nodes for real-time threats...</Text>
        <TouchableOpacity style={styles.demoButton} onPress={simulateThreat}>
          <Text style={styles.demoButtonText}>Test Alert (Simulate Edge AI)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.alertContainer}>
      <View style={styles.header}>
        <Text style={styles.alertTitle}>🚨 THREAT DETECTED 🚨</Text>
        <Text style={styles.alertDetails}>Location: {activeIncident?.zone}</Text>
        <Text style={styles.alertDetails}>
          Type: {activeIncident?.threat_classification} | Confidence:{' '}
          {Number(activeIncident?.confidence_score || 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            title="Incident Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${activeIncident.latitude},${activeIncident.longitude}&z=16&output=embed`}
          />
        ) : (
          <Text style={styles.subText}>
            Coordinates: {activeIncident?.latitude}, {activeIncident?.longitude}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => setActiveIncident(null)}>
        <Text style={styles.buttonText}>Acknowledge & Clear Alert</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  standby: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    color: '#4caf50',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  demoButton: {
    marginTop: 30,
    backgroundColor: '#2c2c2c',
    borderColor: '#555',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  alertContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#d32f2f',
    padding: 24,
    alignItems: 'center',
  },
  alertTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  alertDetails: {
    color: '#fff',
    fontSize: 16,
    marginTop: 6,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
