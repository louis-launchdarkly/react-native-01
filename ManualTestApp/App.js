import React, {Component} from 'react';
import {Text} from 'react-native';
import LDClient from 'launchdarkly-react-native-client-sdk';

class App extends Component {
  state = {output: 'default string'};

  init(userConfig) {
    const clientConfig = {
      mobileKey: 'MOBILE_KEY',
      offline: false,
      // https://github.com/mitmproxy/mitmproxy/issues/4469
      // BrowserStack is using this as proxy and until the issue above is resolved we would
      // need to keep Server Side Events off in order to have a working Network Inspection monitor
      // --------------------------------------------------------------------
      // An incompatibility between react-native@0.66 and launch-darkly@5.1.0
      // has caused us to use stream:false on android devices
      // https://advanceautoparts.atlassian.net/browse/MOB-5449
      stream: true,
      evaluationReasons: true,
    };
    this.client = new LDClient();
    this.isCurrentlyInitialising = Promise.race([
      this.client.configure(clientConfig, userConfig),
      new Promise(resolve => {
        setTimeout(() => {
          resolve(null);
        }, 1000);
      }),
    ]);
    return this.isCurrentlyInitialising.then(() => {
      this.isCurrentlyInitialising = undefined;
    });
  }

  async configure() {
    console.info('LaunchDarkly: Began configuration');
    try {
      const userConfig = {
        key: 'default',
        anonymous: true,
      };

      if (this.isCurrentlyInitialising) {
        await this.isCurrentlyInitialising;
      }

      if (this.client) {
        await this.currentlyIdentifyingPromise;
        this.currentlyIdentifyingPromise = this.client.identify(userConfig);
        await this.currentlyIdentifyingPromise;
      } else {
        await this.init(userConfig);
      }
      console.info('LaunchDarkly: Finished configuration');
    } catch (error) {
      console.error('LaunchDarkly: Could not configure', error);
      throw error;
    }

    return 'what';
  }

  async getFlag() {
    let result = this.configure().then(
      this.client.stringVariation('string-flag', 'hey').then(value => {
        console.log(value);
        this.setState({output: JSON.stringify(value)});
      }),
    );
    return await result;
  }

  render() {
    return <Text>FlagValue "{this.state.output}"</Text>;
  }

  componentDidMount() {
    this.getFlag();
  }
}

export default App;
