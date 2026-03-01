export enum IndentationFormatEnum {
  Tabs, Spaces
}

export const Settings: IEditorSettings = {
  WordRegexStart: /(\b\w)| ([-!$ %^&* ()_ +| ~=`{}\[\]:";'<>?,.\/])/g,
  WordRegexEnd: /(\w\b)| ([-!$ %^&* ()_ +| ~=`{}\[\]:";'<>?,.\/])/g,
  WORDRegexStart: /(?<!\S)(\S)/g,
  WORDRegexEnd: /(\S)(?<!\S)/g,
  FontSize: 16,
  // Tabs as default hehe
  IndentationSize: 2,
  RelativeLineNumber: false,
}

interface IEditorSettings {
  WordRegexStart: RegExp,
  WordRegexEnd: RegExp,
  WORDRegexStart: RegExp,
  WORDRegexEnd: RegExp,
  FontSize: number,
  IndentationSize: 2,
  RelativeLineNumber: boolean,
}
