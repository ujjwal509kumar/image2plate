import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  Image, 
  Alert, 
  TextInput, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Import your Frontpage component (adjust path as needed)
import Frontpage from '../(frontpage)/index';

export default function Dashboard() {
  const [displayName, setDisplayName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [backendIP, setBackendIP] = useState('');
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // For scaling bounding boxes over the image.
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [renderedWidth, setRenderedWidth] = useState(0);

  // Check authentication state on mount.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoggedIn(false);
    } else {
      setDisplayName(user.displayName || user.email || 'User');
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to take pictures.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images', // Use string literal 'image'
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log('Image captured:', uri);
      setImageUri(uri);
      setDetections([]); // Clear previous detections
      // Get original dimensions of the captured image
      Image.getSize(uri, (width, height) => {
        setOriginalWidth(width);
        setOriginalHeight(height);
        console.log(`Original dimensions: ${width}x${height}`);
      }, (error) => {
        console.error('Error getting image size:', error);
      });
    }
  };

  const sendToBackend = async () => {
    if (!backendIP.trim()) {
      Alert.alert('Missing IP', 'Please enter the backend server IP.');
      return;
    }
    if (!imageUri) {
      Alert.alert('No Image', 'Please capture an image first.');
      return;
    }

    setLoading(true);
    console.log('Preparing image for upload...');
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'image.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      console.log(`Sending image to backend at http://${backendIP}:8000/detect ...`);
      const response = await fetch(`http://${backendIP}:8000/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
      console.log('Response received from backend.');
      const data = await response.json();
      if (response.ok) {
        console.log('Detection results:', data.detections);
        setDetections(data.detections);
      } else {
        console.error('Backend error:', data.error);
        Alert.alert('Error', data.error || 'Failed to process image.');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      Alert.alert('Error', 'Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  // If the user is not logged in, render the Frontpage.
  if (!isLoggedIn) {
    return <Frontpage />;
  }

  // If detections exist, show the processed view with bounding boxes.
  const renderDetectionsOverlay = () => {
    if (!renderedWidth || !originalWidth) return null;
    // Calculate scale factor from original image width to rendered width.
    const scale = renderedWidth / originalWidth;
    return detections.map((det, index) => {
      // det.bbox: { x1, y1, x2, y2 }
      const { x1, y1, x2, y2 } = det.bbox;
      const left = x1 * scale;
      const top = y1 * scale;
      const width = (x2 - x1) * scale;
      const height = (y2 - y1) * scale;
      return (
        <View 
          key={index}
          style={[
            styles.bbox, 
            { left, top, width, height }
          ]}
        >
          <Text style={styles.bboxText}>{det.class} ({det.confidence})</Text>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity style={styles.logoutIconContainer} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{displayName}!</Text>
        </View>

        {/* Backend IP Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter Backend IP Address"
          value={backendIP}
          onChangeText={setBackendIP}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
        />

        {/* Capture Image Button */}
        <TouchableOpacity style={styles.card} onPress={pickImage}>
          <Ionicons name="camera-outline" size={32} color="#6A7BFF" />
          <Text style={styles.cardText}>Capture & Detect Object</Text>
        </TouchableOpacity>

        {/* If no detections, show raw captured image and process button */}
        {imageUri && detections.length === 0 && (
          <View style={styles.imagePreviewContainer}>
            <View 
              style={styles.imageContainer}
              onLayout={(e) => {
                setRenderedWidth(e.nativeEvent.layout.width);
              }}
            >
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            </View>
            <TouchableOpacity style={styles.processButton} onPress={sendToBackend} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.processButtonText}>Send to Backend</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* If detections exist, show the processed image with bounding boxes */}
        {imageUri && detections.length > 0 && (
          <View style={styles.processedImageContainer}>
            <View 
              style={styles.imageContainer}
              onLayout={(e) => {
                setRenderedWidth(e.nativeEvent.layout.width);
              }}
            >
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              {renderDetectionsOverlay()}
            </View>
            <View style={styles.detectionsList}>
              <Text style={styles.resultsTitle}>Detected Objects:</Text>
              {detections.map((det, index) => (
                <Text key={index} style={styles.resultItem}>
                  {det.class} (Confidence: {det.confidence})
                </Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e9edf3' },
  contentContainer: { padding: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30, 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 3 }, 
    shadowRadius: 8, 
    elevation: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#333' },
  logoutIconContainer: { backgroundColor: '#ff4d4d', padding: 10, borderRadius: 10 },
  welcomeSection: { marginBottom: 20, alignItems: 'center' },
  welcomeText: { fontSize: 20, color: '#555' },
  userName: { fontSize: 28, fontWeight: '800', color: '#6A7BFF', marginTop: 8 },
  input: { 
    backgroundColor: '#fff', 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  card: { 
    backgroundColor: '#fff', 
    paddingVertical: 24, 
    paddingHorizontal: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 3 }, 
    shadowRadius: 8, 
    elevation: 3, 
    marginBottom: 20,
  },
  cardText: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 12 },
  imagePreviewContainer: { alignItems: 'center', marginBottom: 20 },
  processedImageContainer: { alignItems: 'center', marginBottom: 20 },
  imageContainer: { width: '100%', position: 'relative' },
  imagePreview: { width: '100%', height: 250, borderRadius: 12 },
  processButton: { backgroundColor: '#6A7BFF', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginTop: 10 },
  processButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  detectionsList: { marginTop: 20, backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '100%', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  resultsTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  resultItem: { fontSize: 16, color: '#333', marginVertical: 4 },
  // Styles for bounding boxes overlay
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF0000',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  bboxText: {
    color: '#FF0000',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    paddingHorizontal: 4,
  },
});
