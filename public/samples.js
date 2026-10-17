export const samples = {
  studio: {
    name: 'The “tiny” website update', client: 'Alex', project: 'Luna Studio / Website', rate: 85, budget: 2400, currency: 'USD',
    contract: `PROJECT: Luna Studio marketing website\nDeliverables: A five-page responsive website: Home, About, Services, Work, Contact.\nThe project includes two rounds of design revisions.\nThe Contact page includes one contact form.\nExclusions: E-commerce, payment integration, and ongoing maintenance are not included.\nAdditional pages and integrations require a separate change order.\nProject fee: $2,400. Hourly rate for approved additional work: $85.\nCurrent status: Both rounds of design revisions have been completed.`,
    request: `Hey! The site looks amazing. Just a couple of tiny things before we launch:\nCould we add a shop with Stripe checkout so I can sell our prints?\nAlso, can you create three more service pages?\nI'd love one more round of design revisions on the homepage.\nAnd please make sure the contact form works on mobile.\nShould all be pretty quick, right? Thanks!`,
    report: {
      summary: 'Three requests expand the agreed scope. Mobile contact-form functionality is already included.',
      items: [
        { title: 'Shop + Stripe checkout', classification: 'extra', requestQuote: 'add a shop with Stripe checkout', contractQuote: 'E-commerce, payment integration, and ongoing maintenance are not included.', reason: 'A storefront and payment flow are explicitly excluded.', hours: 12 },
        { title: 'Three additional service pages', classification: 'extra', requestQuote: 'create three more service pages', contractQuote: 'Additional pages and integrations require a separate change order.', reason: 'New pages expand the five-page agreement.', hours: 6 },
        { title: 'A third design revision round', classification: 'extra', requestQuote: 'one more round of design revisions', contractQuote: 'Both rounds of design revisions have been completed.', reason: 'The two included revision rounds have already been used.', hours: 3 },
        { title: 'Mobile contact-form check', classification: 'included', requestQuote: 'make sure the contact form works on mobile', contractQuote: 'A five-page responsive website', reason: 'A working responsive contact page is part of the original deliverable.', hours: 0 }
      ]
    }
  },
  brand: {
    name: 'The logo that became a brand', client: 'Sam', project: 'Goodfolk / Brand identity', rate: 70, budget: 950, currency: 'USD',
    contract: 'Brand identity package: one primary logo, two initial concepts, one revision round, final SVG and PNG files. The revision round has not been used. Packaging design and social media templates are excluded. Fee: $950. Additional work billed at $70/hour after approval.',
    request: 'Love the logo! Can we try a darker green in the revision round? Also need packaging for three coffee bags and six Instagram post templates. Could you send the final logo in SVG too?',
    report: { summary: 'Packaging and social templates are extra. The color revision and SVG export are already included.', items: [
      { title: 'Three coffee-bag packages', classification: 'extra', requestQuote: 'packaging for three coffee bags', contractQuote: 'Packaging design and social media templates are excluded.', reason: 'Packaging is an explicitly excluded deliverable.', hours: 9 },
      { title: 'Six Instagram templates', classification: 'extra', requestQuote: 'six Instagram post templates', contractQuote: 'Packaging design and social media templates are excluded.', reason: 'Social media templates require an additional agreement.', hours: 4 },
      { title: 'Darker green color revision', classification: 'included', requestQuote: 'try a darker green in the revision round', contractQuote: 'The revision round has not been used.', reason: 'This fits the unused revision round.', hours: 0 },
      { title: 'SVG logo export', classification: 'included', requestQuote: 'send the final logo in SVG', contractQuote: 'final SVG and PNG files', reason: 'SVG delivery was already promised.', hours: 0 }
    ] }
  },
  video: {
    name: 'One video. Five more versions.', client: 'Jordan', project: 'Fieldnotes / Launch film', rate: 95, budget: 1800, currency: 'USD',
    contract: 'Produce one 60-second launch film in 16:9 format with captions, licensed music, and one revision round. Vertical adaptations, additional languages, and raw footage delivery are excluded. Delivery: one final MP4 file. Project fee: $1,800. Extra work: $95/hour with written approval.',
    request: 'The film is great. Can you add the captions we discussed? We also need a 9:16 version for Reels, Spanish and French versions, and all your raw footage. Thanks!',
    report: { summary: 'Captions are included. Vertical delivery, translations, and raw footage need separate approval.', items: [
      { title: 'Vertical Reels adaptation', classification: 'extra', requestQuote: 'a 9:16 version for Reels', contractQuote: 'Vertical adaptations, additional languages, and raw footage delivery are excluded.', reason: 'An additional aspect ratio is explicitly excluded.', hours: 3 },
      { title: 'Spanish and French versions', classification: 'extra', requestQuote: 'Spanish and French versions', contractQuote: 'Vertical adaptations, additional languages, and raw footage delivery are excluded.', reason: 'Localization is outside the original agreement; translation costs need separate confirmation.', hours: 6 },
      { title: 'Raw footage handoff', classification: 'extra', requestQuote: 'all your raw footage', contractQuote: 'Vertical adaptations, additional languages, and raw footage delivery are excluded.', reason: 'Raw delivery is excluded. Confirm rights and licensing before proposing delivery.', hours: 2 },
      { title: 'Caption delivery', classification: 'included', requestQuote: 'add the captions we discussed', contractQuote: 'with captions', reason: 'The original film includes captions.', hours: 0 }
    ] }
  }
};
