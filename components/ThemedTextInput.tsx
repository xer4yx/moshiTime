import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextInputProps = TextInputProps & {
    lightColor?: string;
    darkColor?: string;
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedTextInput({ style, lightColor, darkColor, ...otherProps }: ThemedTextInputProps) {
    const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'borderOutline');
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'textInputBackground');
    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

    return <TextInput style={[{ borderColor, backgroundColor, color: textColor }, styles.input, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        margin: 8,
    },
});