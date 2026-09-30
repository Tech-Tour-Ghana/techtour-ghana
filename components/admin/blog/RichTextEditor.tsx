'use client';

// TinyMCE, self-hosted. The runtime is copied to /public/tinymce by
// scripts/copy-tinymce.mjs, so nothing loads from Tiny Cloud or a CDN and no API
// key is needed. license_key "gpl" selects TinyMCE's open-source (GPL v2+) terms.
// Only core, open-source plugins are used.

import { Editor } from '@tinymce/tinymce-react';
import { useMemo, useRef } from 'react';

import { useTheme } from '@/context/ThemeContext';

export interface LinkItem { title: string; value: string }

export interface ImagePick { src: string; alt?: string; title?: string }

interface Props {
  value: string;
  onChange: (html: string) => void;
  /** Called when the image dialog wants a file. Call back with the chosen asset. */
  onPickImage: (done: (pick: ImagePick) => void) => void;
  /** Internal pages offered in the link dialog's "Link list". */
  linkItems: LinkItem[];
}

const contentStyle = (dark: boolean) => `
  body { font-family: Inter, system-ui, sans-serif; font-size: 17px; line-height: 1.7; max-width: 44rem; margin: 1rem auto; padding: 0 1rem; color: ${dark ? '#E5E7EB' : '#111827'}; }
  h2 { font-size: 1.6rem; line-height: 1.25; margin: 1.6em 0 0.6em; } h3 { font-size: 1.3rem; margin: 1.4em 0 0.5em; } h4 { font-size: 1.1rem; }
  a { color: #139EA2; } img { max-width: 100%; height: auto; border-radius: 0.75rem; }
  blockquote { border-left: 4px solid #139EA2; margin-left: 0; padding-left: 1rem; font-style: italic; }
  table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid ${dark ? '#4B5563' : '#D1D5DB'}; padding: 0.5em 0.75em; }
  figure { margin: 1em 0; } figcaption { text-align: center; font-size: 0.875rem; opacity: 0.8; }
  .align-center { text-align: center; } .align-right { text-align: right; } .align-left { text-align: left; }
  img.img-md { max-width: 70%; display: block; margin-inline: auto; } img.img-sm { max-width: 40%; display: block; margin-inline: auto; }
`;

export default function RichTextEditor({ value, onChange, onPickImage, linkItems }: Props) {
  const { isDimMode } = useTheme();
  // TinyMCE reads its config once, so hand it refs that always point at the latest props.
  const pickRef = useRef(onPickImage);
  const linksRef = useRef(linkItems);
  pickRef.current = onPickImage;
  linksRef.current = linkItems;

  const init = useMemo(
    () => ({
      base_url: '/tinymce',
      suffix: '.min',
      height: 560,
      menubar: false,
      branding: false,
      promotion: false,
      skin: isDimMode ? 'oxide-dark' : 'oxide',
      content_css: isDimMode ? 'dark' : 'default',
      content_style: contentStyle(isDimMode),
      plugins: 'advlist autolink charmap code fullscreen image link lists searchreplace table wordcount',
      toolbar:
        'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist blockquote | link image table hr | removeformat | searchreplace code fullscreen',
      toolbar_mode: 'sliding' as const,
      // The article title is the page H1, so the editor starts at H2.
      block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4',
      // Never store scriptable or form markup. The server sanitises again on every render.
      invalid_elements: 'script,iframe,object,embed,form,input,textarea,select,button,style,link,meta',
      convert_urls: false,
      entity_encoding: 'raw' as const,
      browser_spellcheck: true,
      // Images must come from the Media Library, never pasted or dropped as base64.
      paste_data_images: false,
      automatic_uploads: false,
      images_upload_handler: () => Promise.reject(new Error('Insert images from the Media Library.')),
      file_picker_types: 'image',
      file_picker_callback: (
        callback: (url: string, meta?: Record<string, string>) => void,
        _value: string,
        meta: { filetype?: string },
      ) => {
        if (meta.filetype !== 'image') return;
        pickRef.current((pick) => callback(pick.src, { alt: pick.alt ?? '', title: pick.title ?? '' }));
      },
      image_caption: true,
      image_title: true,
      image_description: true,
      image_dimensions: false,
      image_class_list: [
        { title: 'Full width', value: '' },
        { title: 'Medium', value: 'img-md' },
        { title: 'Small', value: 'img-sm' },
      ],
      link_default_protocol: 'https',
      link_assume_external_targets: 'https' as const,
      link_title: false,
      target_list: [{ title: 'Same window', value: '' }, { title: 'New window', value: '_blank' }],
      link_list: (success: (items: LinkItem[]) => void) => success(linksRef.current),
      // Alignment as classes, which the sanitiser and stylesheet both know.
      formats: {
        alignleft: { selector: 'p,h2,h3,h4,li,td,th,figure,img', classes: 'align-left' },
        aligncenter: { selector: 'p,h2,h3,h4,li,td,th,figure,img', classes: 'align-center' },
        alignright: { selector: 'p,h2,h3,h4,li,td,th,figure,img', classes: 'align-right' },
      },
      table_default_attributes: {},
      table_default_styles: {},
    }),
    [isDimMode],
  );

  return (
    <Editor
      key={isDimMode ? 'dim' : 'bright'}
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      licenseKey="gpl"
      value={value}
      onEditorChange={onChange}
      init={init}
    />
  );
}
