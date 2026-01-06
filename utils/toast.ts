import Toast from "react-native-toast-message";

export const showToast = {
  success: (message: string, title?: string) => {
    Toast.show({
      type: "success",
      text1: "",
      text2: message,
      visibilityTime: 2000,
      position: "top",
    });
  },
  error: (message: string, title?: string) => {
    Toast.show({
      type: "error",
      text1: "",
      text2: message,
      visibilityTime: 3500,
      position: "top",
    });
  },
  info: (message: string, title?: string) => {
    Toast.show({
      type: "info",
      text1: "",
      text2: message,
      visibilityTime: 2500,
      position: "top",
    });
  },
  warning: (message: string, title?: string) => {
    Toast.show({
      type: "warning",
      text1: "",
      text2: message,
      visibilityTime: 3000,
      position: "top",
    });
  },
};

