/* Fade & Blade — admin content schema.
   Describes every editable field, grouped to mirror content.json.
   Node shapes:
     group : { type: "group", label, fields: { key: node } }
     list  : { type: "list",  label, item: node, itemLabel: "name", newItem: {} }
     scalar: { label, type: "text"|"textarea"|"url"|"image"|"color"|"number"|"icon"|"select", options?, help? }
*/

window.FB_SCHEMA = {
  type: "group",
  label: "Site",
  fields: {
    site: {
      type: "group",
      label: "Brand & SEO",
      fields: {
        brandLeft: { label: "Brand — first word", type: "text" },
        brandAmp: { label: "Brand — separator", type: "text" },
        brandRight: { label: "Brand — second word", type: "text" },
        seoTitle: { label: "Browser / SEO title", type: "text" },
        seoDescription: { label: "Meta description", type: "textarea" },
        theme: {
          type: "group",
          label: "Theme colors",
          fields: {
            primary: { label: "Primary (near black)", type: "color" },
            panel: { label: "Panel", type: "color" },
            panel2: { label: "Panel 2", type: "color" },
            gold: { label: "Gold accent / CTA", type: "color" },
            goldBright: { label: "Gold bright", type: "color" },
            goldDeep: { label: "Gold deep", type: "color" },
            background: { label: "Page background", type: "color" },
            foreground: { label: "Body text", type: "color" },
            cream: { label: "Cream (on dark)", type: "color" }
          }
        }
      }
    },

    topbar: {
      type: "group",
      label: "Top bar",
      fields: {
        hours: { label: "Opening hours line", type: "text" },
        phone: { label: "Phone (display)", type: "text" },
        phoneHref: { label: "Phone link", type: "text", help: "e.g. tel:+15551234567" },
        address: { label: "Address line", type: "text" }
      }
    },

    nav: {
      type: "group",
      label: "Navigation",
      fields: {
        cta: { label: "Button label", type: "text" },
        links: {
          type: "list",
          label: "Menu links",
          itemLabel: "label",
          newItem: { label: "New link", href: "#" },
          item: {
            type: "group",
            label: "Link",
            fields: {
              label: { label: "Label", type: "text" },
              href: { label: "Anchor / URL", type: "text" }
            }
          }
        }
      }
    },

    hero: {
      type: "group",
      label: "Hero",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        titleLine1: { label: "Heading line 1", type: "text" },
        titleAccent: { label: "Heading line 2 (gold)", type: "text" },
        titleLine2: { label: "Heading line 3", type: "text" },
        lead: { label: "Lead paragraph", type: "textarea" },
        ctaPrimary: { label: "Primary button", type: "text" },
        ctaSecondary: { label: "Secondary button", type: "text" },
        image: { label: "Background image", type: "image" },
        ratingValue: { label: "Rating value", type: "text" },
        ratingCount: { label: "Rating count", type: "text" }
      }
    },

    marquee: {
      type: "list",
      label: "Marquee strip",
      itemLabel: "",
      newItem: "New highlight",
      item: { label: "Highlight", type: "text" }
    },

    stats: {
      type: "list",
      label: "Statistics",
      itemLabel: "label",
      newItem: { value: "0", suffix: "", label: "New stat" },
      item: {
        type: "group",
        label: "Stat",
        fields: {
          value: { label: "Value", type: "text" },
          suffix: { label: "Suffix", type: "text" },
          label: { label: "Label", type: "text" }
        }
      }
    },

    services: {
      type: "group",
      label: "Services",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        lead: { label: "Lead", type: "textarea" },
        items: {
          type: "list",
          label: "Services",
          itemLabel: "title",
          newItem: { icon: "scissors", title: "New service", description: "", price: "from $0" },
          item: {
            type: "group",
            label: "Service",
            fields: {
              icon: {
                label: "Icon",
                type: "select",
                options: ["scissors", "razor", "towel", "beard", "family", "sparkle"]
              },
              title: { label: "Title", type: "text" },
              description: { label: "Description", type: "textarea" },
              price: { label: "Price", type: "text" }
            }
          }
        }
      }
    },

    about: {
      type: "group",
      label: "About",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        paragraphs: {
          type: "list",
          label: "Paragraphs",
          itemLabel: "",
          newItem: "New paragraph",
          item: { label: "Paragraph", type: "textarea" }
        },
        ticks: {
          type: "list",
          label: "Checklist",
          itemLabel: "",
          newItem: "New point",
          item: { label: "Point", type: "text" }
        },
        ctaLabel: { label: "Button label", type: "text" },
        ctaHref: { label: "Button link", type: "text" },
        image: { label: "Image", type: "image" },
        imageAlt: { label: "Image alt text", type: "text" },
        badgeLabel: { label: "Badge label", type: "text" },
        badgeValue: { label: "Badge value", type: "text" }
      }
    },

    team: {
      type: "group",
      label: "Barbers",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        lead: { label: "Lead", type: "textarea" },
        members: {
          type: "list",
          label: "Team members",
          itemLabel: "name",
          newItem: { name: "New barber", role: "Barber", bio: "", photo: "", instagram: "#", x: "#" },
          item: {
            type: "group",
            label: "Member",
            fields: {
              name: { label: "Name", type: "text" },
              role: { label: "Role", type: "text" },
              bio: { label: "Bio", type: "textarea" },
              photo: { label: "Photo", type: "image" },
              instagram: { label: "Instagram URL", type: "text" },
              x: { label: "X URL", type: "text" }
            }
          }
        }
      }
    },

    gallery: {
      type: "group",
      label: "Gallery",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        leadPrefix: { label: "Lead (before handle)", type: "text" },
        handle: { label: "Social handle", type: "text" },
        leadSuffix: { label: "Lead (after handle)", type: "text" },
        images: {
          type: "list",
          label: "Images",
          itemLabel: "alt",
          newItem: { src: "", alt: "New image", size: "normal" },
          item: {
            type: "group",
            label: "Image",
            fields: {
              src: { label: "Image", type: "image" },
              alt: { label: "Alt text", type: "text" },
              size: { label: "Size", type: "select", options: ["normal", "tall", "wide"] }
            }
          }
        }
      }
    },

    pricing: {
      type: "group",
      label: "Pricing",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        lead: { label: "Lead", type: "textarea" },
        note: { label: "Footnote", type: "text" },
        plans: {
          type: "list",
          label: "Plans",
          itemLabel: "name",
          newItem: {
            name: "New plan", description: "", price: "$0", period: "/ visit",
            featured: false, badge: "", ctaLabel: "Book now", ctaHref: "#booking", features: []
          },
          item: {
            type: "group",
            label: "Plan",
            fields: {
              name: { label: "Name", type: "text" },
              description: { label: "Description", type: "textarea" },
              price: { label: "Price", type: "text" },
              period: { label: "Period", type: "text" },
              featured: { label: "Featured (highlighted)", type: "checkbox" },
              badge: { label: "Badge", type: "text" },
              ctaLabel: { label: "Button label", type: "text" },
              ctaHref: { label: "Button link", type: "text" },
              features: {
                type: "list",
                label: "Features",
                itemLabel: "",
                newItem: "New feature",
                item: { label: "Feature", type: "text" }
              }
            }
          }
        }
      }
    },

    testimonials: {
      type: "group",
      label: "Testimonials",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        items: {
          type: "list",
          label: "Quotes",
          itemLabel: "author",
          newItem: { quote: "", author: "New customer", role: "", rating: 5 },
          item: {
            type: "group",
            label: "Quote",
            fields: {
              quote: { label: "Quote", type: "textarea" },
              author: { label: "Author", type: "text" },
              role: { label: "Role / detail", type: "text" },
              rating: { label: "Rating (1–5)", type: "number" }
            }
          }
        }
      }
    },

    booking: {
      type: "group",
      label: "Booking form",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        introPrefix: { label: "Intro text", type: "textarea" },
        points: {
          type: "list",
          label: "Reassurance points",
          itemLabel: "title",
          newItem: { title: "New point", text: "" },
          item: {
            type: "group",
            label: "Point",
            fields: {
              title: { label: "Title", type: "text" },
              text: { label: "Text", type: "text" }
            }
          }
        },
        services: {
          type: "list",
          label: "Service options",
          itemLabel: "",
          newItem: "New service",
          item: { label: "Option", type: "text" }
        },
        barbers: {
          type: "list",
          label: "Barber options",
          itemLabel: "",
          newItem: "New barber",
          item: { label: "Option", type: "text" }
        },
        times: {
          type: "list",
          label: "Time options",
          itemLabel: "",
          newItem: "12:00 PM",
          item: { label: "Option", type: "text" }
        },
        submitLabel: { label: "Submit button", type: "text" },
        successMessage: { label: "Success message", type: "text" }
      }
    },

    contact: {
      type: "group",
      label: "Contact",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        addressLine1: { label: "Address line 1", type: "text" },
        addressLine2: { label: "Address line 2", type: "text" },
        directionsLabel: { label: "Directions link label", type: "text" },
        phone: { label: "Phone (display)", type: "text" },
        phoneHref: { label: "Phone link", type: "text" },
        email: { label: "Email", type: "text" },
        mapUrl: { label: "Map embed URL", type: "url" },
        hours: {
          type: "list",
          label: "Opening hours",
          itemLabel: "label",
          newItem: { label: "Day", value: "9:00 – 20:00" },
          item: {
            type: "group",
            label: "Row",
            fields: {
              label: { label: "Day", type: "text" },
              value: { label: "Hours", type: "text" }
            }
          }
        }
      }
    },

    ctaBanner: {
      type: "group",
      label: "CTA banner",
      fields: {
        title: { label: "Title", type: "text" },
        text: { label: "Text", type: "text" },
        primaryLabel: { label: "Primary button", type: "text" },
        secondaryLabel: { label: "Secondary button", type: "text" }
      }
    },

    faq: {
      type: "group",
      label: "FAQ",
      fields: {
        eyebrow: { label: "Eyebrow", type: "text" },
        title: { label: "Title", type: "text" },
        items: {
          type: "list",
          label: "Questions",
          itemLabel: "question",
          newItem: { question: "New question", answer: "" },
          item: {
            type: "group",
            label: "Question",
            fields: {
              question: { label: "Question", type: "text" },
              answer: { label: "Answer", type: "textarea" }
            }
          }
        }
      }
    },

    footer: {
      type: "group",
      label: "Footer",
      fields: {
        description: { label: "Description", type: "textarea" },
        hoursNote: { label: "Hours note", type: "text" },
        newsletterNote: { label: "Newsletter note", type: "text" },
        copyright: { label: "Copyright line", type: "text" },
        socials: {
          type: "list",
          label: "Social links",
          itemLabel: "network",
          newItem: { network: "Instagram", href: "#" },
          item: {
            type: "group",
            label: "Social",
            fields: {
              network: {
                label: "Network",
                type: "select",
                options: ["Instagram", "Facebook", "X", "TikTok"]
              },
              href: { label: "URL", type: "text" }
            }
          }
        },
        columns: {
          type: "list",
          label: "Footer columns",
          itemLabel: "title",
          newItem: { title: "New column", links: [] },
          item: {
            type: "group",
            label: "Column",
            fields: {
              title: { label: "Title", type: "text" },
              links: {
                type: "list",
                label: "Links",
                itemLabel: "label",
                newItem: { label: "New link", href: "#" },
                item: {
                  type: "group",
                  label: "Link",
                  fields: {
                    label: { label: "Label", type: "text" },
                    href: { label: "URL", type: "text" }
                  }
                }
              }
            }
          }
        },
        legal: {
          type: "list",
          label: "Legal links",
          itemLabel: "label",
          newItem: { label: "New link", href: "#" },
          item: {
            type: "group",
            label: "Link",
            fields: {
              label: { label: "Label", type: "text" },
              href: { label: "URL", type: "text" }
            }
          }
        }
      }
    }
  }
};
