import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { Avatar } from '@/components/Avatar';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Format address display
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function UserAvatar() {
  const { user, logout } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowMenu(true)}>
        <Avatar seed={user.address} size={32} />
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menu, { backgroundColor: colors.card }]}>
            <Avatar seed={user.address} size={48} />
            <Text style={[styles.address, { color: colors.text }]}>
              {formatAddress(user.address)}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.logoutText, { color: '#E74C3C' }]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menu: {
    borderRadius: 12,
    padding: 16,
    minWidth: 160,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  address: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  menuItem: {
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
