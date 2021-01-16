/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import {Root, StyleProvider} from 'native-base';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from 'react-native';
import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import getTheme from './native-base-theme/components';
import platform from './native-base-theme/variables/platform';
import ConnectionScreen from './src/ConnectionScreen';
import DeviceListScreen from './src/DeviceListScreen';

const App: () => React$Node = () => {
  const [device, setDevice] = useState();
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  selectDevice = (device) => {
    console.log('App::selectDevice() called with: ', device);
    setDevice(device);
  };

  onStateChanged = (stateChangedEvent) => {
    console.log(
      'App::onStateChanged event used for onBluetoothEnabled and onBluetoothDisabled',
    );
    setBluetoothEnabled(stateChangedEvent.enabled);
    setDevice(stateChangedEvent.enabled ? device : '');
  };

  checkBluetootEnabled = async () => {
    try {
      console.log('App::componentDidMount Checking bluetooth status');
      let enabled = await RNBluetoothClassic.isBluetoothEnabled();

      console.log(`App::componentDidMount Status: ${enabled}`);
      setBluetoothEnabled(enabled);
    } catch (error) {
      console.log('App::componentDidMount Status Error: ', error);
      setBluetoothEnabled(false);
    }
  };

  useEffect(() => {
    let enabledSubscription;
    let disabledSubscription;
    
    console.log('test---------')

    async function anyNameFunction() {
      try {
        enabledSubscription = RNBluetoothClassic.onBluetoothEnabled((event) =>
          onStateChanged(event),
        );
        disabledSubscription = RNBluetoothClassic.onBluetoothDisabled((event) =>
          onStateChanged(event),
        );

        checkBluetootEnabled();
      } catch (err) {
        // Handle accordingly
      }
    }

    // Execute the created function directly
    anyNameFunction();

    return () => {
      enabledSubscription.remove();
      disabledSubscription.remove();
    };
  }, []);

  return (
    <>
       <StyleProvider style={getTheme(platform)}>
        <Root>
          {!device ? (
            <DeviceListScreen
              bluetoothEnabled={bluetoothEnabled}
              selectDevice={selectDevice}
            />
          ) : (
            <ConnectionScreen
              device={device}
              onBack={() => setDevice(undefined)}
            />
          )}
        </Root>
      </StyleProvider>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
