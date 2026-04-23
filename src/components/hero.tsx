import Image from "next/image";
import { Link } from "@/i18n/navigation";

type HeroProps = {
  badge?: string;
  title: string;
  description: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText?: string;
  secondaryBtnLink?: string;
  imageSrc: string;
  imageAlt: string;
  benefits?: string[];
};

export function Hero({
  badge,
  title,
  description,
  primaryBtnText,
  primaryBtnLink,
  secondaryBtnText,
  secondaryBtnLink,
  imageSrc,
  imageAlt,
  benefits = []
}: HeroProps) {
  return (
    <section className="heroUniversal container">
      <div className="page heroUniversalInner">
        <div className="heroUniversalCopy">
          {badge ? <span className="heroBadge">{badge}</span> : null}
          <h1>{title}</h1>
          <p>{description}</p>

          <div className="actions">
            <Link href={primaryBtnLink} className="button primary">
              {primaryBtnText}
            </Link>

            {secondaryBtnText && secondaryBtnLink ? (
              <Link href={secondaryBtnLink} className="button secondary">
                {secondaryBtnText}
              </Link>
            ) : null}
          </div>

          {benefits.length > 0 ? (
            <div className="heroBenefits">
              {benefits.map((benefit) => (
                <span key={benefit}>{benefit}</span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="heroUniversalMedia">
          <div className="heroUniversalImageWrap">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              className="heroUniversalImage"
              sizes="(max-width: 960px) 100vw, 50vw"
            />
          </div>
          <div className="heroUniversalOrb" />
        </div>
      </div>
    </section>
  );
}
