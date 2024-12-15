import puppeteer from "puppeteer";

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(
      "https://pages.coupang.com/p/121237?sourceType=oms_goldbox"
    );
    await page.waitForNetworkIdle();

    console.log("페이지 스크롤 중...");
    await smoothScroll(page);

    const products = await page.evaluate(() => {
      const links = document.querySelectorAll("a");
      return Array.from(links)
        .filter((link) => link.href.includes("www.coupang.com/vp/products"))
        .map((link) => link.href);
    });

    // 중복 제거
    const uniqueLinks = [...new Set(products)];

    console.log("총 상품 수:", uniqueLinks.length);
    uniqueLinks.forEach((link, index) => {
      console.log(`[${index + 1}] ${link}`);
    });

    await page.close();
    await browser.close();
  } catch (error) {
    console.error("크롤링 중 에러 발생:", error);
  }
};

// 부드러운 스크롤 함수
async function smoothScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let lastHeight = document.documentElement.scrollHeight;
      const distance = 300; // 한 번에 스크롤할 거리

      const scroll = () => {
        const currentPosition = window.pageYOffset;
        const newPosition = currentPosition + distance;
        window.scrollTo(0, newPosition);

        setTimeout(() => {
          const currentHeight = document.documentElement.scrollHeight;
          if (newPosition >= currentHeight || currentHeight === lastHeight) {
            resolve();
          } else {
            lastHeight = currentHeight;
            scroll();
          }
        }, 10); // 스크롤 간격 1초
      };

      scroll();
    });
  });
}

crawler();
