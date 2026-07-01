import { Image, Text, View } from "react-native";

import { styles } from "../styles/appStyles";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={require("../../carpin.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </View>
  );
}
