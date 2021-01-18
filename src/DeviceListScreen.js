import React from 'react';
import {Platform} from 'react-native';
import {
  Body,
  Container,
  Content,
  Button,
  Text,
  Icon,
  Right,
  Toast,
  Header,
  Title,
} from 'native-base';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import {
  PermissionsAndroid,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {NativeModules, NativeEventEmitter} from 'react-native';

const BleManagerModule = NativeModules.RNBluetoothClassic;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
/**
 * See https://reactnative.dev/docs/permissionsandroid for more information
 * on why this is required (dangerous permissions).
 */
const requestAccessFineLocationPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Access fine location required for discovery',
      message:
        'In order to perform discovery, you must enable/allow ' +
        'fine location access.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

/**
 * Displays the device list and manages user interaction.  Initially
 * the NativeDevice[] contains a list of the bonded devices.  By using
 * the Discover Devices action the list will be updated with unpaired
 * devices.
 *
 * From here:
 * - unpaired devices can be paired
 * - paired devices can be connected
 *
 * @author kendavidson
 */
export default class DeviceListScreen extends React.Component {
  constructor(props) {
    super(props);
    console.log('bleManagerEmitter', bleManagerEmitter);
    this.state = {
      devices: [],
      accepting: false,
      discovering: false,
    };
  }

  componentDidMount() {
    this.getBondedDevices();
    console.log('***componentDidMount');
    this.onBluetoothDisabled = bleManagerEmitter.addListener(
      'onBluetoothDisabled',
      (d) => {
        console.log('***componentDidMount onBluetoothDisabled d', d);
      },
    );
    console.log('bleManagerEmitter', bleManagerEmitter);
    this.onStateChanged = bleManagerEmitter.addListener(
      'onStateChanged',
      (d) => {
        console.log('***componentDidMount onStateChanged d', d);
      },
    );
    console.log('this.onStateChanged ', this.onStateChanged);
    this.onBluetoothEnabled = RNBluetoothClassic.onBluetoothEnabled((d) => {
      console.log('***componentDidMount onBluetoothEnabled d', d);
    });
    this.onConnect = RNBluetoothClassic.onStateChanged((d) => {
      console.log('***componentDidMount onStateChanged d', d);
    });
    this.onDiscovered = RNBluetoothClassic.onDeviceDiscovered((d) => {
      console.log('***componentDidMount onDeviceDiscovered d', d);
    });
    this.onConnected = RNBluetoothClassic.onDeviceConnected((d) => {
      console.log('***componentDidMount onDeviceConnected d', d);
    });
    this.refresh();
  }

  refresh() {
    RNBluetoothClassic.getBondedDevices()
      .then(
        (de) => {
          console.log('getBondedDevices de', de);
        },
        (error) => {
          console.log('getBondedDevices error', error);
        },
      )
      .catch((error) => {
        console.log('getBondedDevices catch error', error);
      });
    RNBluetoothClassic.getConnectedDevices()
      .then(
        (de) => {
          console.log('getConnectedDevices de', de);
        },
        (error) => {
          console.log('getConnectedDevices error', error);
        },
      )
      .catch((error) => {
        console.log('getConnectedDevices catch error', error);
      });
    // RNBluetoothClassic.getConnectedDevice((de) => {
    //   console.log('getBondedDevices de', de);
    // });
    // setTimeout(() => {
    //   this.refresh();
    // }, 2000);
  }

  componentWillUnmount() {
    if (this.state.accepting) {
      this.cancelAcceptConnections(false);
    }

    if (this.state.discovering) {
      this.cancelDiscovery(false);
    }
  }

  /**
   * Gets the currently bonded devices.
   */
  getBondedDevices = async (unloading) => {
    console.log('DeviceListScreen::getBondedDevices');
    try {
      let bonded = await RNBluetoothClassic.getBondedDevices();
      console.log('DeviceListScreen::getBondedDevices found', bonded);

      if (!unloading) {
        this.setState({devices: bonded});
      }
    } catch (error) {
      this.setState({devices: []});

      Toast.show({
        text: error.message,
        duration: 5000,
      });
    }
  };

  /**
   * Starts attempting to accept a connection.  If a device was accepted it will
   * be passed to the application context as the current device.
   */
  acceptConnections = async () => {
    if (this.state.accepting) {
      Toast.show({
        text: 'Already accepting connections',
        duration: 5000,
      });

      return;
    }

    this.setState({accepting: true});

    try {
      let device = await RNBluetoothClassic.accept({delimiter: '\r'});
      if (device) {
        this.props.selectDevice(device);
      }
    } catch (error) {
      // If we're not in an accepting state, then chances are we actually
      // requested the cancellation.  This could be managed on the native
      // side but for now this gives more options.
      if (!this.state.accepting) {
        Toast.show({
          text: 'Attempt to accept connection failed.',
          duration: 5000,
        });
      }
    } finally {
      this.setState({accepting: false});
    }
  };

  /**
   * Cancels the current accept - might be wise to check accepting state prior
   * to attempting.
   */
  cancelAcceptConnections = async () => {
    if (!this.state.accepting) {
      return;
    }

    try {
      let cancelled = await RNBluetoothClassic.cancelAccept();
      this.setState({accepting: !cancelled});
    } catch (error) {
      Toast.show({
        text: 'Unable to cancel accept connection',
        duration: 2000,
      });
    }
  };

  startDiscovery = async () => {
    try {
      let granted = await requestAccessFineLocationPermission();

      if (!granted) {
        throw new Error('Access fine location was not granted');
      }

      this.setState({discovering: true});

      let devices = [...this.state.devices];

      try {
        let unpaired = await RNBluetoothClassic.startDiscovery();

        let index = devices.findIndex((d) => !d.bonded);
        if (index >= 0) {
          devices.splice(index, devices.length - index, ...unpaired);
        } else {
          devices.push(...unpaired);
        }

        Toast.show({
          text: `Found ${unpaired.length} unpaired devices.`,
          duration: 2000,
        });
      } finally {
        this.setState({devices, discovering: false});
      }
    } catch (err) {
      Toast.show({
        text: err.message,
        duration: 2000,
      });
    }
  };

  cancelDiscovery = async () => {
    try {
    } catch (error) {
      Toast.show({
        text: 'Error occurred while attempting to cancel discover devices',
        duration: 2000,
      });
    }
  };

  requestEnabled = async () => {
    try {
    } catch (error) {
      Toast.show({
        text: `Error occurred while enabling bluetooth: ${error.message}`,
        duration: 200,
      });
    }
  };

  render() {
    let toggleAccept = this.state.accepting
      ? () => this.cancelAcceptConnections()
      : () => this.acceptConnections();

    let toggleDiscovery = this.state.discovering
      ? () => this.cancelDiscovery()
      : () => this.startDiscovery();

    console.log('this.props.bluetoothEnabled----', this.props.bluetoothEnabled);
    return (
      <Container>
        <Header iosBarStyle="light-content">
          <Body>
            <Title>Devices</Title>
          </Body>
          {this.props.bluetoothEnabled ? (
            <Right>
              <Button transparent onPress={this.getBondedDevices}>
                <Icon type="Ionicons" name="md-sync" />
              </Button>
            </Right>
          ) : null}
        </Header>
        {this.props.bluetoothEnabled ? (
          <>
            <DeviceList
              devices={this.state.devices}
              onPress={this.props.selectDevice}
            />
            {Platform.OS !== 'ios' ? (
              <View>
                <Button block onPress={toggleAccept}>
                  <Text>
                    {this.state.accepting
                      ? 'Accepting (cancel)...'
                      : 'Accept Connection'}
                  </Text>
                </Button>
                <Button block onPress={toggleDiscovery}>
                  <Text>
                    {this.state.discovering
                      ? 'Discovering (cancel)...'
                      : 'Discover Devices'}
                  </Text>
                </Button>
              </View>
            ) : null}
          </>
        ) : (
          <Content contentContainerStyle={styles.center}>
            <Text>Bluetooth is OFF</Text>
            <Button onPress={() => this.requestEnabled()}>
              <Text>Enable Bluetooth</Text>
            </Button>
          </Content>
        )}
      </Container>
    );
  }
}

/**
 * Displays a list of Bluetooth devices.
 *
 * @param {NativeDevice[]} devices
 * @param {function} onPress
 * @param {function} onLongPress
 */
export const DeviceList = ({devices, onPress, onLongPress}) => {
  console.log('devices', devices);
  const renderItem = ({item}) => {
    return (
      <DeviceListItem
        device={item}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    );
  };

  return (
    <FlatList
      data={devices}
      renderItem={renderItem}
      keyExtractor={(item) => item.address}
    />
  );
};

export const DeviceListItem = ({device, onPress, onLongPress}) => {
  let bgColor = device.connected ? '#0f0' : '#fff';
  let icon = device.bonded ? 'ios-bluetooth' : 'ios-cellular';

  return (
    <TouchableOpacity
      onPress={() => onPress(device)}
      onLongPress={() => onLongPress(device)}
      style={styles.deviceListItem}>
      <View style={styles.deviceListItemIcon}>
        <Icon type="Ionicons" name={icon} color={bgColor} />
      </View>
      <View>
        <Text>{device.name}</Text>
        <Text note>{device.address}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  deviceListItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  deviceListItemIcon: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
