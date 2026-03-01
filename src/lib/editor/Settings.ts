import { dev } from "$app/environment";

export enum IndentationFormatEnum {
  Tabs, Spaces
}

export const Settings: IEditorSettings = {
  WordRegexStart: /(\b\w)| ([-!$ %^&* ()_ +| ~=`{}\[\]:";'<>?,.\/])/g,
  WordRegexEnd: /(\w\b)| ([-!$ %^&* ()_ +| ~=`{}\[\]:";'<>?,.\/])/g,
  WORDRegexStart: /(?<!\S)(\S)/g,
  WORDRegexEnd: /(\S)(?<!\S)/g,
  FontSize: 16,
  IndentationSize: 2,
  RelativeLineNumber: false,
  SaveToClipboard: dev,
}

interface IEditorSettings {
  WordRegexStart: RegExp,
  WordRegexEnd: RegExp,
  WORDRegexStart: RegExp,
  WORDRegexEnd: RegExp,
  FontSize: number,
  IndentationSize: 2,
  RelativeLineNumber: boolean,
  SaveToClipboard: boolean,
}
