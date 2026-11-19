import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// --- 1. Supabase Config (Paste your keys from App.js) ---
const SUPABASE_URL = 'https://ddcrnfojzuhogkuexboz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_secret_tqBpHryhF4ZTli629lhFZQ_gqJYn9J9';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function SecurityDashboard() {
  const [activeIncident, setActiveIncident] = useState<any>(null);

  useEffect(() => {
    const channel = supabase
      .channel('public:incidents')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          setActiveIncident({
            ...payload.new,
            latitude: 7.4444,
            longitude: 3.9000,
            zone: 'Kenneth Dike Library, University of Ibadan',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!activeIncident) {
    return (
      <View style={styles.standby}>
        <Text style={styles.statusText}>🟢 System Online</Text>
        <Text style={styles.subText}>Monitoring Edge AI Nodes for real-time threats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.alertContainer}>
      <View style={styles.header}>
        <Text style={styles.alertTitle}>🚨 THREAT DETECTED 🚨</Text>
        <Text style={styles.alertDetails}>Location: {activeIncident.zone}</Text>
        <Text style={styles.alertDetails}>
          Type: {activeIncident.threat_classification} | Confidence:{' '}
          {Number(activeIncident.confidence_score || 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            title="Incident Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            src="https://maps.google.com/maps?q=7.4444,3.9000&z=16&output=embed"
          />
        ) : (
          <Text style={styles.subText}>Coordinates: 7.4444, 3.9000</Text>
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