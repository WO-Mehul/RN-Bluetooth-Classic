/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import {Root, StyleProvider} from 'native-base';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import getTheme from './native-base-theme/components';
import platform from './native-base-theme/variables/platform';
import ConnectionScreen from './src/ConnectionScreen';
import DeviceListScreen from './src/DeviceListScreen';

const App: () => React$Node = () => {
  const [device, setDevice] = useState();
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  selectDevice = (device) => {
    setDevice(device);
  };

  onStateChanged = (stateChangedEvent) => {
    setBluetoothEnabled(stateChangedEvent.enabled);
    setDevice(stateChangedEvent.enabled ? device : '');
  };

  checkBluetootEnabled = async () => {
    try {
      let enabled = await RNBluetoothClassic.isBluetoothEnabled();

      setBluetoothEnabled(enabled);
    } catch (error) {
      console.log('App::componentDidMount Status Error: ', error);
      setBluetoothEnabled(false);
    }
  };

  useEffect(() => {
    let enabledSubscription;
    let disabledSubscription;

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
export default App;
