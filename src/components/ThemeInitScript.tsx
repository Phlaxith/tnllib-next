export default function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var m = document.cookie.match(/(?:^|; )theme=([^;]*)/);
              var t = m ? decodeURIComponent(m[1]) : 'dark';
              document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
            } catch(e) {}
          })();
        `,
      }}
    />
  );
}

