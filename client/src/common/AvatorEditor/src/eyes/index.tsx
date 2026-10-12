
import Circle from "./Circle";
import Oval from "./Oval";
import Smile from "./Smile";

export default function eyes(props: any) {
  const { style } = props;
  switch (style) {
    case "circle": return <Circle />;
    case "smile": return <Smile />;
    case "oval":
    default:
      return <Oval />;
  }
}
