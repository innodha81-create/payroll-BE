export interface GeneratePosterInput {
  jobTitle: string;
  description: string;
  lastApplyDate?: string;
  companyName?: string;
  employeeName?: string;
  platforms?: string[];
}

export interface GeneratedPosterData {
  industry: string;
  industryCategory: string;
  headline: string;
  badge: string;
  roleTitle: string;
  keyRequirements: string[];
  keyBenefits: string[];
  quote: string;
  callToAction: string;
  socialCaption: string;
  colorTheme: 'cyan' | 'blue' | 'emerald' | 'violet' | 'amber';
  backgroundImageUrl: string;
}

const INDUSTRY_IMAGES: Record<string, string> = {
  healthcare: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1000&auto=format&fit=crop&q=80',
  finance: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1000&auto=format&fit=crop&q=80',
  hospitality: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
  sales: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&auto=format&fit=crop&q=80',
  construction: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&auto=format&fit=crop&q=80',
  education: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1000&auto=format&fit=crop&q=80',
  logistics: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80',
  legal: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80',
  creative: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1000&auto=format&fit=crop&q=80',
  tech: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
  corporate: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80'
};

export class HirePilotService {
  private static readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

  // Dual model cascade to eliminate 503 or latency spikes
  private static readonly MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];

  public static async generateJobPoster(input: GeneratePosterInput): Promise<GeneratedPosterData> {
    const {
      jobTitle,
      description,
      lastApplyDate = '',
      companyName = 'Company',
      employeeName = '',
      platforms = []
    } = input;

    const prompt = `You are a universal recruitment advertising creative director.
This job opening can be for ANY industry (Healthcare, Finance, Hospitality, Sales, Construction, Legal, Education, Logistics, Creative, Retail, Manufacturing, Tech, etc.).
Analyze the following job details provided by the recruiter:

- Company Name: ${companyName}
- Job Title: ${jobTitle}
- Recruiter / Contact: ${employeeName || 'Talent Acquisition Team'}
- Last Apply Date: ${lastApplyDate || 'Immediate Joining'}
- Full Job Description: ${description || jobTitle}
- Target Platforms: ${platforms.length ? platforms.join(', ') : 'LinkedIn, Social Media, Job Portals'}

Generate a 100% industry-customized social media job poster specification strictly tailored to this profession.
Do NOT default to tech unless it is actually a software/tech role.
Extract real requirements, perks, and tone suited for this specific industry.

Return ONLY a valid raw JSON object with the following schema:
{
  "industry": "The exact industry name (e.g. Healthcare, Finance, Hospitality, Construction, Sales, Legal, Education, Logistics, Creative, Tech, etc.)",
  "industryCategory": "One of: 'healthcare', 'finance', 'hospitality', 'sales', 'construction', 'education', 'logistics', 'legal', 'creative', 'tech', 'corporate'",
  "headline": "A dynamic, role-specific creative headline synthesized from the profession and description",
  "badge": "A tailored hiring badge based on the job details (e.g. 'URGENT HIRING' or 'WALK-IN INTERVIEW' or 'IMMEDIATE OPENING' or 'FULL-TIME POSITION')",
  "roleTitle": "${jobTitle}",
  "keyRequirements": ["Array of 3 to 4 specific qualifications or responsibilities extracted directly from description"],
  "keyBenefits": ["Array of 2 to 3 perks/benefits extracted directly from description"],
  "quote": "A 1-sentence inspiring pitch for candidates in this profession",
  "callToAction": "Clear instructions on applying and deadline",
  "socialCaption": "A complete, beautifully formatted social media broadcast post with emojis, structured sections, apply date, recruiter contact, and relevant hashtags",
  "colorTheme": "One of: 'emerald' (for healthcare/eco), 'blue' (for finance/corporate), 'amber' (for hospitality/construction/trades), 'violet' (for creative/legal), 'cyan' (for tech/modern)"
}`;

    for (const model of this.MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[HirePilotService] Model ${model} returned (${response.status}):`, errorText);
          continue;
        }

        const jsonResponse: any = await response.json();
        const rawText = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          console.warn(`[HirePilotService] Empty response from ${model}`);
          continue;
        }

        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const category = INDUSTRY_IMAGES[parsed.industryCategory]
          ? parsed.industryCategory
          : this.detectCategoryFromTitle(jobTitle);

        return {
          industry: parsed.industry || 'Professional Services',
          industryCategory: category,
          headline: parsed.headline || `Join ${companyName} as ${jobTitle}`,
          badge: parsed.badge || "WE'RE HIRING",
          roleTitle: parsed.roleTitle || jobTitle,
          keyRequirements: Array.isArray(parsed.keyRequirements) && parsed.keyRequirements.length
            ? parsed.keyRequirements
            : [jobTitle, 'Industry Expertise', 'Team Collaboration'],
          keyBenefits: Array.isArray(parsed.keyBenefits) && parsed.keyBenefits.length
            ? parsed.keyBenefits
            : ['Competitive Compensation', 'Growth Opportunities', 'Positive Culture'],
          quote: parsed.quote || `Make a lasting impact with ${companyName}.`,
          callToAction: parsed.callToAction || `Apply before ${lastApplyDate || 'closing date'}.`,
          socialCaption: parsed.socialCaption || `📢 We are hiring a ${jobTitle} at ${companyName}! #Hiring #Jobs`,
          colorTheme: ['cyan', 'blue', 'emerald', 'violet', 'amber'].includes(parsed.colorTheme)
            ? parsed.colorTheme
            : 'blue',
          backgroundImageUrl: INDUSTRY_IMAGES[category] || INDUSTRY_IMAGES.corporate
        };
      } catch (err) {
        console.error(`[HirePilotService] Error with ${model}:`, err);
      }
    }

    // Dynamic smart fallback if all models fail
    return this.getFallbackPoster(input);
  }

  private static detectCategoryFromTitle(title: string): string {
    const t = title.toLowerCase();
    if (/doctor|nurse|medical|health|clinic|hospital|pediatric|surgeon|pharma|dentist/i.test(t)) return 'healthcare';
    if (/chef|cook|hotel|restaurant|barista|waiter|hospitality|catering/i.test(t)) return 'hospitality';
    if (/accountant|audit|ca|finance|banking|tax|financial|investment/i.test(t)) return 'finance';
    if (/sales|marketing|business develop|bde|account manager|real estate/i.test(t)) return 'sales';
    if (/civil|site|construction|architect|engineer|electrician|plumber/i.test(t)) return 'construction';
    if (/teacher|tutor|professor|school|faculty|trainer|education/i.test(t)) return 'education';
    if (/driver|delivery|logistics|warehouse|supply chain|fleet|transport/i.test(t)) return 'logistics';
    if (/lawyer|legal|advocate|compliance|counsel/i.test(t)) return 'legal';
    if (/design|video|editor|photographer|writer|content|creative|art/i.test(t)) return 'creative';
    if (/developer|software|code|react|node|python|frontend|backend|fullstack|devops|cloud|qa/i.test(t)) return 'tech';
    return 'corporate';
  }

  private static getFallbackPoster(input: GeneratePosterInput): GeneratedPosterData {
    const { jobTitle, companyName = 'Company', lastApplyDate, employeeName } = input;
    const category = this.detectCategoryFromTitle(jobTitle);
    return {
      industry: category.charAt(0).toUpperCase() + category.slice(1),
      industryCategory: category,
      headline: `Shape the Future as our ${jobTitle}`,
      badge: "WE'RE HIRING",
      roleTitle: jobTitle,
      keyRequirements: ['Domain Expertise', 'Professional Excellence', 'Collaborative Mindset'],
      keyBenefits: ['Competitive Compensation', 'Career Advancement', 'Supportive Culture'],
      quote: `Join ${companyName} and elevate your career in ${category}.`,
      callToAction: `Reach out to ${employeeName || 'our team'} before ${lastApplyDate || 'the deadline'} to apply.`,
      socialCaption: `📢 ${companyName} is hiring a ${jobTitle}!\n\n📅 Last Date: ${lastApplyDate || 'Immediate'}\n👤 Recruiter: ${employeeName || 'HR Team'}\n\n#Hiring #${jobTitle.replace(/[^a-zA-Z0-9]/g, '')} #Career`,
      colorTheme: category === 'healthcare' ? 'emerald' : category === 'hospitality' || category === 'construction' ? 'amber' : category === 'creative' || category === 'legal' ? 'violet' : 'blue',
      backgroundImageUrl: INDUSTRY_IMAGES[category] || INDUSTRY_IMAGES.corporate
    };
  }
}
