import { Fragment } from "react";

import EarSmall from "./Small";
import EarBig from "./Big";

export default function Ear(props: any) {
  const { color, size="small" } = props;
  return (
    <Fragment>
      {size === "small" &&
        <EarSmall color={color} />
      }
      {size === "big" &&
        <EarBig color={color} />
      }
    </Fragment>
  );
}
