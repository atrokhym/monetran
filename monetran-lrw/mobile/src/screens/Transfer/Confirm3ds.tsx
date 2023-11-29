import React, { Component, useCallback } from "react";
import { Alert, Button, Linking, StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
import { ThemeConsumer } from "react-native-elements";
import { NavigationComponentProps } from "react-native-navigation";
import { appTheme } from "../../styles";
import ScreenLayout from "../../components/ScreenLayout";

import { withAccountContext } from "../../contexts/account";
import { withRatesContext } from "../../contexts/rates";
import { withUserContext } from "../../contexts/user";
import WithdrawReview from "./WithdrawReview";

interface Confirm3dsProps {
  wyreUrl: string;
}

function Confirm3ds({ wyreUrl, componentId }: Confirm3dsProps & NavigationComponentProps) {

  return (
    <ScreenLayout componentId={componentId}>
      <ThemeConsumer<typeof appTheme>>
        {({ theme }) => (
          <>
            {(() => {
              return (
                // <View 
                //   //style={theme.Container}
                //   style={{flex: 1}}                  
                // >
                  <WebView
                    source={{
                      uri: wyreUrl
                    }}
                    style={{
                      marginTop: 20,
                      height: 400
                    }}
                  />
        
                // </View>
              );
            })()}
          </>
        )}
{/* 
          // <View style={theme.Container}>
          //   <Text style={{ color: "blue" }} onPress={() => Linking.openURL(wyreUrl)}>
          //     Confirm 3D secure...
          //   </Text>

          //   <WebView 
          //     source={{ uri: "https://www.google.com" }}
          //     style={{ flex: 1 }}
          //     androidLayerType="software"
          //     // androidHardwareAccelerationDisabled={true}
          //   />
          // </View>
 */}
      </ThemeConsumer>
    </ScreenLayout>
  );
}
  

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'whitesmoke'
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',

  },
  video: {
    marginTop: 100,
    maxHeight: 200,
    width: 320,
    alignItems: 'center',
    flex: 1
  }
});

export default withRatesContext(withAccountContext(withUserContext(Confirm3ds)));
