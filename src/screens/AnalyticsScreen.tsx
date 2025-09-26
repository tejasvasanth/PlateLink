import React from 'react';
import { View, Text } from 'react-native';

const AnalyticsScreen: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Analytics</Text>
      <Text style={{ marginTop: 8, color: '#666', textAlign: 'center' }}>
        This is a placeholder for the Analytics screen. Implementation coming soon.
      </Text>
    </View>
  );
};

export default AnalyticsScreen;