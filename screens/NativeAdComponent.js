import React, { useState, useEffect } from 'react';
import { Text, Image, StyleSheet } from 'react-native';
import {
    NativeAd,
    TestIds,
    NativeAdView,
    NativeAsset,
    NativeAssetType,
    NativeMediaView,
    NativeAdEventType,
    NativeMediaAspectRatio,
} from 'react-native-google-mobile-ads';

const NativeAdComponent = () => {
    const [nativeAd, setNativeAd] = useState(null);

    useEffect(() => {
        NativeAd.createForAdRequest(TestIds.NATIVE, { aspectRatio: NativeMediaAspectRatio.LANDSCAPE })
            .then(setNativeAd)
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!nativeAd) return;
        const listener = nativeAd.addAdEventListener(NativeAdEventType.CLICKED, () => {
            console.log('Native ad clicked');
        });
        return () => {
            listener.remove();
            // or
            nativeAd.destroy();
        };
    }, [nativeAd]);

    if (!nativeAd) {
        return null;
    }

    return (
        <NativeAdView nativeAd={nativeAd} >
            {/* {nativeAd.icon && (
                <NativeAsset assetType={NativeAssetType.ICON}>
                    <Image
                        source={{ uri: nativeAd.icon.url }}
                        style={{ width: 10, height: 10, borderRadius: 4 }}
                        resizeMode="cover"
                    />
                </NativeAsset>
            )} */}

            {/* NativeMediaView doesn't need an Image inside */}
            <NativeMediaView style={{
                width: "100%", // or a fixed width if you want it centered
                height: 125,
                borderRadius: 8,
                marginVertical: 10,
                alignSelf: 'center', // this centers it horizontally
            }} resizeMode={'contain'} />

            <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text style={{ fontSize: 18, alignSelf: 'center', fontWeight: 'bold' }}>
                    {nativeAd.headline}
                </Text>
            </NativeAsset>
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <Text style={{ alignSelf: 'center', color: 'white' }} >{nativeAd.callToAction}</Text>
            </NativeAsset>
            <Text style={{ color: 'white', fontSize: 12, textAlign: 'left', alignSelf: 'flex-start', paddingLeft: 10, }}>
                Sponsored
            </Text>
        </NativeAdView>

    );
};

const styles = StyleSheet.create({
    adContainer: {
        flex: 1,
        backgroundColor: '#F1F3F6',
        padding: 16,
        borderRadius: 5,
    },
    adBanner: {
        // Remove the fixed height!
        height: '30%',
        width: '100%',
        // justifyContent: 'center',
        // alignItems: 'center',
        //borderBottomColor: '#D3D3D3',
        // borderWidth: .5,
        // padding: 2,
    },
});

export default NativeAdComponent;
