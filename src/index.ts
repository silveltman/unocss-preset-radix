import { genCSS, generateColors, generateHues, newPalette } from "./utils";
import type { RadixColors } from "./radix";
import type { Preset } from "unocss";
import type { Theme } from "unocss/preset-uno";

export * from "./radix";

export type ColorAliases = Record<string, RadixColors>;

export interface PresetRadixOptions {
  palette: readonly RadixColors[];
  /**
   * The prefix of the generated css variables
   * @default --un-preset-radix
   */
  prefix?: string;

  /**
   * Customize the selector used to apply the dark versions of the color palette
   * @default ".dark-theme"
   */
  darkSelector?: string;

  /**
   * Customize the selector used to apply the light versions of the color palette
   * @default ":root, .light-theme"
   */
  lightSelector?: string;

  /** Add color aliases */
  aliases?: ColorAliases;

  /**
   * Extend instead of override the default theme
   * @default false
   */
  extend?: boolean;
}

export function generateAliases(
  colors: ReturnType<typeof generateColors>,
  aliases: ColorAliases
) {
  return Object.entries(aliases).reduce((o, [alias, target]) => {
    o[alias] = colors[target];
    o[`${alias}A`] = colors[`${target}A`];
    return o;
  }, {} as Record<string, Record<number, string>>);
}

function minify(css: string) {
  return css.replace(/\n/g, "").replace(/\s+/g, "").trim();
}

export function presetRadix(options: PresetRadixOptions): Preset<Theme> {
  const {
    prefix = "--un-preset-radix-",
    darkSelector = ".dark-theme",
    lightSelector = ":root, .light-theme",
    palette: selectedColors,
    aliases: selectedAliases = {},
    extend = false,
  } = options;

  const palette = newPalette(...selectedColors);
  const colors = generateColors(palette, prefix);
  const hues = generateHues(prefix);
  const aliases = generateAliases(colors, selectedAliases);

  return {
    name: "unocss-preset-radix",
    rules: [
      [
        /^hue-(.+)$/,
        ([, color]) => {
          let target: string = "";

          if (selectedColors.includes(color as RadixColors)) {
            target = color;
          } else if (color in selectedAliases) {
            target = selectedAliases[color];
          }

          if (target) {
            let css = `.hue-${color} {`;

            for (let shade = 1; shade <= 12; shade++) {
              css += `${prefix}hue${shade}: var(${prefix}${target}${shade});`;
              css += `${prefix}hue${shade}A: var(${prefix}${target}${shade}A);`;
            }
            css += `${prefix}hue-fg: var(${prefix}${target}-fg);`;

            css += "}";

            return minify(css);
          }

          return "";
        },
      ],
    ],
    extendTheme(theme: Theme) {
      theme.colors = {
        ...colors,
        ...aliases,
        ...hues,

        white: "#ffffff",
        black: "#000000",
        transparent: "transparent",
        current: "currentColor",
        inherit: "inherit",

        ...(extend ? theme.colors : []),
      } as Theme["colors"];
    },
    preflights: [
      {
        getCSS: () => genCSS(palette, darkSelector, lightSelector, prefix),
      },
    ],
  };
}
