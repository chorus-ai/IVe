
import Up from "./Up";
import UpWoman from "./UpWoman";

export default function eyebrow(props: any) {
  const { style } = props;
  switch (style) {
    case "upWoman": return <UpWoman />;
    case "up":
    default:
      return <Up />;
  }
}
