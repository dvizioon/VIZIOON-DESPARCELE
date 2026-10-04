"use client";

import { useMemo } from "react";
import { Editor } from "@tinymce/tinymce-react";

const PLUGINS = [
  "accordion",
  "advlist",
  "anchor",
  "autolink",
  "autoresize",
  "autosave",
  "charmap",
  "code",
  "codesample",
  "directionality",
  "emoticons",
  "fullscreen",
  "help",
  "image",
  "importcss",
  "insertdatetime",
  "link",
  "lists",
  "media",
  "nonbreaking",
  "pagebreak",
  "preview",
  "quickbars",
  "searchreplace",
  "table",
  "visualblocks",
  "visualchars",
  "wordcount",
].join(" ");

type NoteEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
  emailMode?: boolean;
};

export function NoteEditor({
  value,
  onChange,
  height = 320,
  placeholder = "Como foi o pagamento, o acordo, o que ficou pendente...",
  emailMode = false,
}: NoteEditorProps) {
  const init = useMemo(
    () => ({
      height,
      min_height: height,
      max_height: Math.max(height + 240, 640),
      menubar: "file edit view insert format tools table help",
      branding: false,
      promotion: false,
      statusbar: true,
      resize: true,
      plugins: PLUGINS,
      toolbar_mode: "sliding" as const,
      toolbar:
        "undo redo restoredraft | blocks fontfamily fontsize | " +
        "bold italic underline strikethrough | forecolor backcolor removeformat | " +
        "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | " +
        "blockquote accordion | link image media table | codesample charmap emoticons | " +
        "ltr rtl | insertdatetime nonbreaking pagebreak anchor | " +
        "searchreplace visualblocks visualchars code preview fullscreen | wordcount help",
      quickbars_selection_toolbar: "bold italic underline | quicklink blockquote | bullist numlist",
      quickbars_insert_toolbar: "image media table codesample accordion hr",
      contextmenu: "link image table lists",
      font_family_formats:
        "Manrope=Manrope,system-ui,sans-serif; Fraunces=Fraunces,Georgia,serif; Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace",
      font_size_formats: "12px 14px 15px 16px 18px 24px 32px",
      image_caption: true,
      image_advtab: true,
      image_title: true,
      automatic_uploads: false,
      allow_html_data_uris: true,
      convert_urls: false,
      xss_sanitization: !emailMode,
      verify_html: !emailMode,
      extended_valid_elements: emailMode
        ? "img[*],table[*],td[*],tr[*],th[*],a[*],div[*],p[*],h1[*],h2[*],span[*],strong[*],svg[*],path[*],rect[*]"
        : undefined,
      file_picker_types: "file image media",
      media_live_embeds: true,
      link_default_target: "_blank",
      link_assume_external_targets: true,
      table_toolbar:
        "tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol",
      insertdatetime_formats: ["%d/%m/%Y", "%d/%m/%Y %H:%M", "%H:%M"],
      autosave_ask_before_unload: true,
      autosave_interval: "20s",
      autosave_restore_when_empty: true,
      autosave_retention: "30m",
      visualblocks_default_state: false,
      content_css: false,
      importcss_append: true,
      content_style:
        "body { font-family: Manrope, system-ui, sans-serif; font-size: 15px; color: #1a1612; }",
      placeholder,
    }),
    [emailMode, height, placeholder],
  );

  return (
    <Editor
      licenseKey="gpl"
      onEditorChange={onChange}
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      value={value}
      init={init}
    />
  );
}
