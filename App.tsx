import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Image,
  PermissionsAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import {Platform, Alert} from 'react-native';
import axios from 'axios';
import ImageView from 'react-native-image-viewing';

interface Photo {
  id: string;
  urls: {
    regular: string;
  };
}

const ACCESS_KEY = 'SbdHOrlVgyh-JXyd7JM41xdfOjdzXj3gCaNo_RVhdAg';

function App(): JSX.Element {
  const [images, setImages] = useState<Photo[]>([]);
  const [page, setPage] = useState<number>(1);
  const [visible, setIsVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState<number>(0);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('https://api.unsplash.com/photos/', {
        params: {
          client_id: ACCESS_KEY,
          page,
          per_page: 50,
        },
      });

      setImages(prevState => [...prevState, ...response.data]);
    } catch (error) {
      console.error(error);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData, page]);

  const fetchMoreData = () => {
    setPage(prevState => prevState + 1);
  };

  const saveImage = async (imageUrl: string) => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to save photos',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const dirs =
          Platform.OS === 'ios'
            ? RNFS.LibraryDirectoryPath
            : RNFS.ExternalDirectoryPath;
        const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
        const path = `${dirs}/${fileName}`;

        const options = {
          fromUrl: imageUrl,
          toFile: path,
        };

        const downloadResult = await RNFS.downloadFile(options).promise;

        if (downloadResult.statusCode === 200) {
          Alert.alert('Success', 'Image saved successfully!');
        } else {
          Alert.alert('Error', 'Failed to save image!');
        }
      } else {
        Alert.alert('Error', 'Storage permission denied!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const imagesData = useMemo(
    () => images.map(image => ({uri: image.urls.regular})),
    [images],
  );

  const renderItem = ({item, index}: {item: Photo; index: number}) => (
    <TouchableOpacity
      onPress={() => {
        setCurrentImage(index);
        setIsVisible(true);
      }}>
      <View style={styles.itemContainer}>
        <Image source={{uri: item.urls.regular}} style={styles.image} />
      </View>
    </TouchableOpacity>
  );

  // eslint-disable-next-line react/no-unstable-nested-components
  const FooterComponent = ({imageIndex}: {imageIndex: number}) => (
    <View style={styles.saveButtonWrapper}>
      <TouchableOpacity
        onPress={() => {
          const image = images.find((_, index) => index === imageIndex)?.urls
            .regular;
          if (image) {
            saveImage(image);
          }
        }}>
        <Text style={styles.saveButton}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.rootView}>
      <FlatList
        data={images}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onEndReached={fetchMoreData}
      />
      <ImageView
        images={imagesData}
        imageIndex={currentImage}
        visible={visible}
        onRequestClose={() => setIsVisible(false)}
        onImageIndexChange={setCurrentImage}
        FooterComponent={FooterComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootView: {
    backgroundColor: 'black',
    position: 'relative',
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'column',
    margin: 1,
  },
  image: {
    flex: 1,
    aspectRatio: 1,
  },
  text: {
    textAlign: 'center',
  },
  saveButtonWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  saveButton: {color: 'white', fontWeight: 'bold', fontSize: 20},
});

export default App;
