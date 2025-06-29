// types/onlyoffice.ts
export interface OnlyOfficeConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions: {
      comment: boolean;
      download: boolean;
      edit: boolean;
      fillForms: boolean;
      modifyFilter: boolean;
      modifyContentControl: boolean;
      review: boolean;
    };
  };
  documentType: "word" | "cell" | "slide";
  editorConfig: {
    mode: "edit" | "view";
    lang: string;
    callbackUrl: string;
    user: {
      id: string;
      name: string;
    };
    customization: {
      autosave: boolean;
      forcesave: boolean;
      compactToolbar: boolean;
    };
  };
  width: string;
  height: string;
}

export interface OnlyOfficeCallbackData {
  status: number;
  url?: string;
  key: string;
  users?: string[];
  actions?: Array<{
    type: number;
    userid: string;
  }>;
}
