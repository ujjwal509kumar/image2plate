import React, { useEffect, useState, useRef } from 'react';
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
  Platform,
  LayoutChangeEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Import your Frontpage component (adjust path as needed)
import Frontpage from '../(frontpage)/index';

// Type definitions for TypeScript
interface DetectionBBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Detection {
  class: string;
  confidence: number;
  bbox: DetectionBBox;
}

interface RenderedImageSize {
  width: number;
  height: number;
}

export default function Dashboard() {
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [backendIP, setBackendIP] = useState<string>('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // For scaling bounding boxes over the image
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [renderedImageSize, setRenderedImageSize] = useState<RenderedImageSize>({ width: 0, height: 0 });

  // Check authentication state on mount
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

  // Pick image from camera or gallery
  const pickImage = async (fromCamera: boolean = true) => {
    let result;
    if (fromCamera) {
      // Request camera permissions using the updated API
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take pictures.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
    } else {
      // Request media library permissions using the updated API
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required to pick images.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
    }

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setDetections([]); // Clear previous detections
      
      // Get original dimensions of the captured/picked image
      Image.getSize(uri, (width, height) => {
        setOriginalWidth(width);
        setOriginalHeight(height);
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
      Alert.alert('No Image', 'Please capture or upload an image first.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'image.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await fetch(`http://${backendIP}:8000/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setDetections(data.detections);
      } else {
        Alert.alert('Error', data.error || 'Failed to process image.');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      Alert.alert('Error', 'Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  // If the user is not logged in, render the Frontpage
  if (!isLoggedIn) {
    return <Frontpage />;
  }

  // Measure image layout for accurate bounding box rendering
  const onImageLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setRenderedImageSize({ width, height });
  };

  // Advanced bounding box rendering with color-coded detection
  const renderDetectionsOverlay = () => {
    if (!renderedImageSize.width || !originalWidth || !originalHeight) return null;
    
    const scaleWidth = renderedImageSize.width / originalWidth;
    const scaleHeight = renderedImageSize.height / originalHeight;
    
    return detections.map((det, index) => {
      const { x1, y1, x2, y2 } = det.bbox;
      
      const left = x1 * scaleWidth;
      const top = y1 * scaleHeight;
      const width = (x2 - x1) * scaleWidth;
      const height = (y2 - y1) * scaleHeight;
      
      const confidencePercent = Math.round(det.confidence * 100);
      
      return (
        <View 
          key={index}
          style={[
            styles.bbox, 
            { 
              left, 
              top, 
              width, 
              height,
              borderColor: getBoundingBoxColor(index)
            }
          ]}
        >
          <Text style={[styles.bboxText, { backgroundColor: getBoundingBoxColor(index, 0.3) }]}>
            {det.class} ({confidencePercent}%)
          </Text>
        </View>
      );
    });
  };

  // Color generation for different detection types
  const getBoundingBoxColor = (index: number, opacity: number = 0.2): string => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF'];
    const baseColor = colors[index % colors.length];
    
    if (opacity < 1) {
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return baseColor;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Object Detector</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>

        {/* Backend IP Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="server-outline" size={24} color="#6A7BFF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter Backend IP Address"
            value={backendIP}
            onChangeText={setBackendIP}
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
          />
        </View>

        {/* Image Selection Options */}
        <View style={styles.imageSelectionContainer}>
          <TouchableOpacity style={styles.imageSelectionButton} onPress={() => pickImage(true)}>
            <Ionicons name="camera-outline" size={24} color="#fff" />
            <Text style={styles.imageSelectionText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageSelectionButton} onPress={() => pickImage(false)}>
            <Ionicons name="image-outline" size={24} color="#fff" />
            <Text style={styles.imageSelectionText}>Upload Image</Text>
          </TouchableOpacity>
        </View>

        {/* Image Preview and Detection */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: imageUri }} 
                style={styles.imagePreview} 
                onLayout={onImageLayout}
                resizeMode="contain"
              />
              {detections.length > 0 && renderDetectionsOverlay()}
            </View>
            
            {detections.length === 0 ? (
              <TouchableOpacity 
                style={styles.processButton} 
                onPress={sendToBackend} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={24} color="#fff" />
                    <Text style={styles.processButtonText}>Detect Objects</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="refresh-outline" size={24} color="#fff" />
                <Text style={styles.resetButtonText}>Clear Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Detection Results List */}
        {detections.length > 0 && (
          <View style={styles.detectionsList}>
            <Text style={styles.resultsTitle}>Detected Objects:</Text>
            {detections.map((det, index) => {
              const confidencePercent = Math.round(det.confidence * 100);
              return (
                <View key={index} style={styles.resultItemContainer}>
                  <View 
                    style={[
                      styles.colorIndicator, 
                      { backgroundColor: getBoundingBoxColor(index) }
                    ]} 
                  />
                  <Text style={styles.resultItem}>
                    <Text style={styles.resultItemClass}>{det.class}</Text>
                    <Text style={styles.resultItemConfidence}> - {confidencePercent}% confidence</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f8ff' 
  },
  contentContainer: { 
    padding: 20,
    paddingBottom: 40
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    backgroundColor: '#6A7BFF', 
    padding: 16, 
    borderRadius: 16, 
    shadowColor: '#6A7BFF', 
    shadowOpacity: 0.3, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 8, 
    elevation: 5,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#fff' 
  },
  logoutButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10 
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4
  },
  welcomeSection: { 
    marginBottom: 24, 
  },
  welcomeText: { 
    fontSize: 18, 
    color: '#555' 
  },
  userName: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#333', 
    marginTop: 4 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff', 
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10
  },
  input: { 
    flex: 1,
    paddingVertical: 14, 
    fontSize: 16,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    shadowColor: '#6A7BFF', 
    shadowOpacity: 0.12, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 10, 
    elevation: 4, 
    marginBottom: 24,
    overflow: 'hidden'
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6A7BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  cardText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333', 
  },
  imagePreviewContainer: { 
    alignItems: 'center', 
    marginBottom: 24,
    width: '100%'
  },
  imageContainer: { 
    width: '100%', 
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  imagePreview: { 
    width: '100%', 
    height: 300, 
  },
  processButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A7BFF', 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    borderRadius: 12, 
    marginTop: 16,
    shadowColor: '#6A7BFF',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  processButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600',
    marginLeft: 8
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4cd964',
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    borderRadius: 12, 
    marginTop: 16,
    shadowColor: '#4cd964',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  resetButtonText: {
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600',
    marginLeft: 8
  },
  detectionsList: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    width: '100%', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowRadius: 8, 
    elevation: 3 
  },
  resultsTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 12,
    color: '#333'
  },
  resultItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10
  },
  resultItem: { 
    fontSize: 16, 
    flex: 1
  },
  resultItemClass: {
    fontWeight: '600',
    color: '#333'
  },
  resultItemConfidence: {
    color: '#666'
  },
  // Styles for bounding boxes overlay
  bbox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FF0000',
    backgroundColor: 'transparent',
  },
  bboxText: {
    color: '#fff',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,0,0,0.7)',
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: -25,
    left: 0,
    borderRadius: 4
  },
  imageSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A7BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '48%',
    justifyContent: 'center',
  },
  imageSelectionText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
