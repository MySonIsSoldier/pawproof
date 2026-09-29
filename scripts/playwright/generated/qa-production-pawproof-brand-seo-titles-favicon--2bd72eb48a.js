import { chromium } from '@playwright/test';

(async () => {
  const origin = 'https://www.pawproof.kr';
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const errors = [];
  const checks = [];
  const routes = [
    {
      path: '/',
      title: 'PawProof | 반려견과 함께하는 좋은 여행',
      heading: '우리 강아지와,\n끝까지 함께.',
    },
    {
      path: '/about',
      title: 'PawProof 소개 | 반려견과 함께하는 좋은 여행',
      heading: '반려견과 함께라서 더 좋은 여행',
    },
    {
      path: '/contact',
      title: 'PawProof 문의하기 | 더 좋은 반려견 여행을 함께 만들어요',
      heading: '우리의 다음 여행을 위해\n작은 이야기를 들려주세요.',
    },
    {
      path: '/guide/dog-friendly-travel',
      title: '반려견 동반여행 준비 체크리스트와 가이드 | PawProof',
      heading: '반려견 동반여행,\n출발 전에 이렇게 확인하세요',
    },
    {
      path: '/regions/gyeonggi-northwest',
      title: '고양·파주·양주 반려견 동반여행 코스와 정보 | PawProof',
      heading: '고양·파주·양주\n반려견 동반여행을 준비해요',
    },
  ];

  async function inspectRoute(viewport, route) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });

    const response = await page.goto(`${origin}${route.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await page.waitForTimeout(800);
    const title = await page.title();
    const heading = await page.locator('h1').first().innerText();
    const details = await page.evaluate(() => ({
      description: document.querySelector('meta[name="description"]')?.content ?? '',
      icons: [...document.querySelectorAll('link[rel~="icon"]')].map((link) => link.getAttribute('href')),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      inputFontSizes: [...document.querySelectorAll('input, textarea, [role="combobox"]')].map(
        (element) => getComputedStyle(element).fontSize,
      ),
    }));

    const result = {
      viewport: `${viewport.width}x${viewport.height}`,
      path: route.path,
      status: response?.status() ?? null,
      title,
      heading,
      description: details.description,
      iconLinks: details.icons,
      noHorizontalOverflow: details.scrollWidth <= details.viewportWidth,
      inputFontSizes: details.inputFontSizes,
      browserErrors: pageErrors,
    };
    if (
      result.status !== 200 ||
      result.title !== route.title ||
      result.heading !== route.heading ||
      !result.noHorizontalOverflow ||
      result.browserErrors.length > 0 ||
      !result.iconLinks.includes('/favicon-32x32.png') ||
      (route.path === '/contact' && result.inputFontSizes.some((size) => parseFloat(size) < 16))
    ) {
      throw new Error(`Production QA failed for ${viewport.width}px ${route.path}: ${JSON.stringify(result)}`);
    }
    checks.push(result);
    errors.push(...pageErrors.map((message) => `${route.path}: ${message}`));
    await context.close();
  }

  for (const route of routes) {
    await inspectRoute({ width: 1600, height: 1000 }, route);
  }
  for (const route of routes) {
    await inspectRoute({ width: 390, height: 844 }, route);
  }

  const iconChecks = {};
  for (const path of ['/favicon.ico', '/favicon-16x16.png', '/favicon-32x32.png']) {
    const response = await fetch(`${origin}${path}`);
    iconChecks[path] = {
      status: response.status,
      contentType: response.headers.get('content-type'),
      size: Number(response.headers.get('content-length') ?? 0),
    };
    if (iconChecks[path].status !== 200) {
      throw new Error(`Favicon QA failed for ${path}: ${JSON.stringify(iconChecks[path])}`);
    }
  }

  const result = { origin, checks, iconChecks, errors };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
