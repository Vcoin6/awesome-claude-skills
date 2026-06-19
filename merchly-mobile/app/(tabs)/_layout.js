import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useCart } from '../../src/cart';
import { useAuth } from '../../src/auth';
import { colors } from '../../src/theme';

function Icon({ label, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>;
}

export default function TabsLayout() {
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.soft, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.fuchsia,
        tabBarInactiveTintColor: colors.faint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Shop', tabBarIcon: ({ focused }) => <Icon label="🛍️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ title: user?.role === 'seller' ? 'Sell' : 'Become a seller', tabBarIcon: ({ focused }) => <Icon label="📈" focused={focused} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <View>
              <Icon label="🛒" focused={focused} />
              {count > 0 && (
                <View style={{ position: 'absolute', right: -10, top: -4, backgroundColor: colors.fuchsia, borderRadius: 999, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <Icon label="👤" focused={focused} /> }}
      />
    </Tabs>
  );
}
