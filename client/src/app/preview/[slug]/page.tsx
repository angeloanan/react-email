import { renderAsync } from "@react-email/render";
import { promises as fs } from "fs";
import { dirname, join as pathJoin } from "path";
import { CONTENT_DIR, getEmails } from "../../../utils/get-emails";
import Preview from "./preview";

export const dynamicParams = true;

export async function generateStaticParams() {
  const { emails } = await getEmails();

  const paths = emails.map((email) => {
    return { slug: email };
  });

  return paths;
}

export default async function Page({ params }) {
  const { emails, filenames } = await getEmails();
  const template = filenames.filter((email) => {
    const [fileName] = email.split(".");
    return params.slug === fileName;
  });

  const Email = (await import(`../../../../emails/${params.slug}`)).default;
  if (Email == null)
    throw new Error(
      `You need to export your Email component as a default export`,
    );

  const previewProps = Email.PreviewProps || {};
  const markup = await renderAsync(<Email {...previewProps} />, {
    pretty: true,
  });
  const plainText = await renderAsync(<Email {...previewProps} />, {
    plainText: true,
  });
  const basePath = pathJoin(process.cwd(), CONTENT_DIR);
  const path = pathJoin(basePath, template[0]);

  // the file is actually just re-exporting the default export of the original file. We need to resolve this first
  const exportTemplateFile: string = await fs.readFile(path, {
    encoding: "utf-8",
  });
  const importPath = exportTemplateFile.match(/import Mail from '(.+)';/)![1];
  const originalFilePath = pathJoin(dirname(path), importPath);

  const reactMarkup: string = await fs.readFile(originalFilePath, {
    encoding: "utf-8",
  });

  return (
    <Preview
      navItems={emails}
      slug={params.slug}
      markup={markup}
      reactMarkup={reactMarkup}
      plainText={plainText}
    />
  );
}

export async function generateMetadata({ params }) {
  return { title: `${params.slug} — React Email` };
}
