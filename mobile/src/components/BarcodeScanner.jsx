import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function BarcodeScanner({ onResult, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: '#fff', marginBottom: 20 }}>
          Нужно разрешение на использование камеры.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={{ color: '#fff' }}>Дать доступ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={onClose}>
          <Text style={{ color: '#fff' }}>Отмена</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={({ data }) => {
          if (data) {
            onResult(data);
          }
        }}
      />
      <View style={styles.header}>
        <Text style={styles.title}>Сканер штрихкода</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center',
  },
  header: {
    position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10,
  },
  title: {
    color: '#fff', fontSize: 18, fontWeight: 'bold',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff', fontSize: 20, fontWeight: 'bold'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
  },
  scanBox: {
    width: 250, height: 150, borderWidth: 2, borderColor: 'rgba(37,99,235,0.5)', borderRadius: 12,
  },
  btn: {
    backgroundColor: '#2563eb', padding: 12, borderRadius: 8,
  },
  btnOutline: {
    marginTop: 10, padding: 12,
  }
});
