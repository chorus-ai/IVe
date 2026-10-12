export const pickRandomFromList = (data: string[], { avoidList = [] as string[], usually = [] as string[] } = {}) => {
  const avoidSet = new Set(avoidList.filter((item) => Boolean(item)));
  let myData = data.filter((item) => !avoidSet.has(item));
  const usuallyData = usually.filter(Boolean).reduce(
    (acc: string[], cur: string) => acc.concat(new Array(15).fill(cur)),
    []
  );
  myData = myData.concat(usuallyData);
  const amount = myData.length;
  const randomIdx = Math.floor(Math.random() * amount);
  return myData[randomIdx];
};

/**
 * Gennerate avatar configurations
 */

export const defaultOptions = {
  sex: ["man", "woman"],
  faceColor: ["#F9C9B6", "#AC6651"],
  earSize: ["small", "big"],
  hairColor: ["#000", "#fff", "#77311D", "#FC909F", "#D2EFF3", "#506AF4", "#F48150"],
  hairStyleMan: ["normal", "thick", "mohawk"],
  hairStyleWoman: ["normal", "womanLong", "womanShort"],
  hatColor: ["#000", "#fff", "#77311D", "#FC909F", "#D2EFF3", "#506AF4", "#F48150"],
  hatStyle: ["beanie", "turban", "none"],
  eyeBrowWoman: ["up", "upWoman"],
  eyeStyle: ["circle", "oval", "smile"],
  glassesStyle: ["round", "square", "none"],
  noseStyle: ["short", "long", "round"],
  mouthStyle: ["laugh", "smile", "peace"],
  shirtStyle: ["hoody", "short", "polo"],
  shirtColor: ["#9287FF", "#6BD9E9", "#FC909F", "#F4D150", "#77311D"],
  bgColor: [
    "#9287FF",
    "#6BD9E9",
    "#FC909F",
    "#F4D150",
    "#E0DDFF",
    "#D2EFF3",
    "#FFEDEF",
    "#FFEBA4",
    "#506AF4",
    "#F48150",
    "#74D153",
    "linear-gradient(45deg, #178bff 0%, #ff6868 100%)",
    "linear-gradient(45deg, #176fff 0%, #68ffef 100%)",
    "linear-gradient(45deg, #ff1717 0%, #ffd368 100%)",
    "linear-gradient(90deg, #36cd1c 0%, #68deff 100%)",
    "linear-gradient(45deg, #3e1ccd 0%, #ff6871 100%)",
    "linear-gradient(45deg, #1729ff 0%, #ff56f7 100%)",
    "linear-gradient(45deg, #56b5f0 0%, #45ccb5 100%)"
  ],
} as const;

type DefaultOptionsKey = keyof typeof defaultOptions;

export interface AvatarConfig {
  sex: string;
  faceColor: string;
  earSize: string;
  eyeStyle: string;
  noseStyle: string;
  mouthStyle: string;
  shirtStyle: string;
  glassesStyle: string;
  hairColor: string;
  hairStyle: string;
  hatStyle: string;
  hatColor: string;
  eyeBrowStyle: string;
  shirtColor: string;
  bgColor: string;
  isGradient?: boolean;
}

const stringToHashCode = (str: string): number => {
  if (str.length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const pickByHashCode = (code: number, type: DefaultOptionsKey, opts?: { avoidList?: string[]; usually?: string[] }): string => {
  const avoidList = (opts && opts.avoidList) || [];
  const usually = (opts && opts.usually) || [];
  const avoidSet = new Set(avoidList);
  const typeOptions = defaultOptions[type] as unknown as string[];
  let myDefaultOptions = typeOptions.filter((item) => !avoidSet.has(item));
  myDefaultOptions = usually
    .filter(Boolean)
    .reduce((acc: string[], cur: string) => acc.concat(new Array(15).fill(cur)), [])
    .concat(myDefaultOptions);
  const index = code % myDefaultOptions.length;
  return myDefaultOptions[index];
};

export const genConfig = (userConfig: Partial<AvatarConfig> | string = {}): AvatarConfig => {
  const isSeedConfig = typeof userConfig === 'string';
  const hashCode = (isSeedConfig && stringToHashCode(userConfig as string)) || 0;
  const cfg = isSeedConfig ? {} as Partial<AvatarConfig> : (userConfig as Partial<AvatarConfig>);
  const response: Partial<AvatarConfig> = {};

  response.sex = isSeedConfig ? pickByHashCode(hashCode, 'sex') : (cfg.sex || pickRandomFromList([...defaultOptions.sex]));
  response.faceColor = isSeedConfig ? pickByHashCode(hashCode, 'faceColor') : (cfg.faceColor || pickRandomFromList([...defaultOptions.faceColor]));
  response.earSize = isSeedConfig ? pickByHashCode(hashCode, 'earSize') : (cfg.earSize || pickRandomFromList([...defaultOptions.earSize]));
  response.eyeStyle = isSeedConfig ? pickByHashCode(hashCode, 'eyeStyle') : (cfg.eyeStyle || pickRandomFromList([...defaultOptions.eyeStyle]));
  response.noseStyle = isSeedConfig ? pickByHashCode(hashCode, 'noseStyle') : (cfg.noseStyle || pickRandomFromList([...defaultOptions.noseStyle]));
  response.mouthStyle = isSeedConfig ? pickByHashCode(hashCode, 'mouthStyle') : (cfg.mouthStyle || pickRandomFromList([...defaultOptions.mouthStyle]));
  response.shirtStyle = isSeedConfig ? pickByHashCode(hashCode, 'shirtStyle') : (cfg.shirtStyle || pickRandomFromList([...defaultOptions.shirtStyle]));
  response.glassesStyle = isSeedConfig
    ? pickByHashCode(hashCode, 'glassesStyle', { usually: ["none"] })
    : (cfg.glassesStyle || pickRandomFromList([...defaultOptions.glassesStyle], { usually: ["none"] }));

  // Hair
  let hairColorAvoidList: string[] = [];
  let hairColorUsually: string[] = [];
  if (isSeedConfig || !cfg.hairColor) {
    switch (response.sex) {
      case "woman": {
        hairColorAvoidList = response.faceColor === defaultOptions.faceColor[1] ? ["#77311D"] : [];
        break;
      }
      case "man": {
        hairColorUsually = ["#000"];
        break;
      }
      default:
        break;
    }
  }
  response.hairColor = isSeedConfig
    ? pickByHashCode(hashCode, 'hairColor', { avoidList: hairColorAvoidList, usually: hairColorUsually })
    : (cfg.hairColor || pickRandomFromList([...defaultOptions.hairColor], { avoidList: hairColorAvoidList, usually: hairColorUsually }));

  if (isSeedConfig || !cfg.hairStyle) {
    switch (response.sex) {
      case "man": {
        response.hairStyle = isSeedConfig
          ? pickByHashCode(hashCode, 'hairStyleMan', { usually: ["normal", "thick"] })
          : pickRandomFromList([...defaultOptions.hairStyleMan], { usually: ["normal", "thick"] });
        break;
      }
      case "woman": {
        response.hairStyle = isSeedConfig
          ? pickByHashCode(hashCode, 'hairStyleWoman')
          : pickRandomFromList([...defaultOptions.hairStyleWoman]);
        break;
      }
      default:
        break;
    }
  } else {
    response.hairStyle = cfg.hairStyle;
  }

  // Hat
  response.hatStyle = isSeedConfig
    ? pickByHashCode(hashCode, 'hatStyle', { usually: ["none"] })
    : (cfg.hatStyle || pickRandomFromList([...defaultOptions.hatStyle], { usually: ["none"] }));
  response.hatColor = isSeedConfig ? pickByHashCode(hashCode, 'hatColor') : (cfg.hatColor || pickRandomFromList([...defaultOptions.hatColor]));
  const hairOrHatColor = response.hatStyle === "none" ? response.hairColor : response.hatColor;

  // Eyebrow
  if (!isSeedConfig && cfg.eyeBrowStyle) {
    response.eyeBrowStyle = cfg.eyeBrowStyle;
  } else {
    response.eyeBrowStyle = response.sex === "woman"
      ? isSeedConfig
        ? pickByHashCode(hashCode, 'eyeBrowWoman')
        : pickRandomFromList([...defaultOptions.eyeBrowWoman])
      : "up";
  }

  // Shirt color
  response.shirtColor = isSeedConfig
    ? pickByHashCode(hashCode, 'shirtColor', { avoidList: hairOrHatColor ? [hairOrHatColor] : [] })
    : cfg.shirtColor || pickRandomFromList([...defaultOptions.shirtColor], { avoidList: hairOrHatColor ? [hairOrHatColor] : [] });

  // Background color
  if (!isSeedConfig && cfg.isGradient) {
    response.bgColor = cfg.bgColor || pickRandomFromList([...defaultOptions.bgColor]);
  } else {
    response.bgColor = isSeedConfig
      ? pickByHashCode(hashCode, 'bgColor', { avoidList: [hairOrHatColor, response.shirtColor].filter(Boolean) as string[] })
      : cfg.bgColor || pickRandomFromList([...defaultOptions.bgColor], { avoidList: [hairOrHatColor, response.shirtColor].filter(Boolean) as string[] });
  }

  return response as AvatarConfig;
};
