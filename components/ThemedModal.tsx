import { Modal, ModalProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedModalProps = ModalProps & {
    lightColor?: string;
    darkColor?: string;
};

export function ThemedModal(props: ThemedModalProps) {
    return (
        <Modal {...props} style={{ backgroundColor: useThemeColor({ light: props.lightColor, dark: props.darkColor }, 'background') }}>
            {props.children}
        </Modal>
    );
}