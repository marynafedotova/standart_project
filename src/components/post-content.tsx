import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DbPostBlock } from "@/lib/json-db";

export function PostContent({ blocks }: { blocks: DbPostBlock[] }) {
  return (
    <div className="postContent">
      {blocks.map((block) => (
        <PostBlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function PostBlockView({ block }: { block: DbPostBlock }) {
  const className = `postBlock ${block.align ? `align-${block.align}` : "align-left"}`;

  if (block.type === "richText" && block.html) {
    return (
      <div
        className={`${className} postRichText`}
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    );
  }

  if (block.type === "heading") {
    const heading =
      block.level === 3 ? (
        <h3>{block.text}</h3>
      ) : (
        <h2>{block.text}</h2>
      );

    return <div className={className}>{wrapWithLink(heading, block.href)}</div>;
  }

  if (block.type === "quote") {
    return (
      <blockquote className={className}>
        {wrapWithLink(<p>{block.text}</p>, block.href)}
      </blockquote>
    );
  }

  if (block.type === "list") {
    return (
      <div className={className}>
        <ul>
          {(block.items ?? []).filter(Boolean).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (block.type === "image" && block.src) {
    const image = (
      <figure className={className}>
        <Image
          src={block.src}
          alt={block.alt || block.text || "Изображение статьи"}
          width={1600}
          height={1000}
          className="postImage"
        />
        {block.text ? <figcaption>{block.text}</figcaption> : null}
      </figure>
    );

    return wrapWithLink(image, block.href);
  }

  return <div className={className}>{wrapWithLink(<p>{block.text}</p>, block.href)}</div>;
}

function wrapWithLink(node: ReactNode, href?: string) {
  if (!href) {
    return node;
  }

  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {node}
      </a>
    );
  }

  return <Link href={href}>{node}</Link>;
}
