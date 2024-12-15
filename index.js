import puppeteer from "puppeteer";

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(
      "https://pages.coupang.com/p/121237?sourceType=oms_goldbox",
      { waitUntil: "networkidle0" }
    );

    console.log("페이지 스크롤 시작...");

    let previousProductCount = 0;
    let sameCountTimes = 0;

    while (true) {
      const currentProducts = await page.evaluate(() => {
        const products = document.querySelectorAll(".grid-2 .weblog");
        return products.length;
      });

      console.log(`현재 로드된 상품 수: ${currentProducts}`);

      if (currentProducts === previousProductCount) {
        sameCountTimes++;
        if (sameCountTimes >= 3) {
          console.log("더 이상 새로운 상품이 로드되지 않음");
          break;
        }
      } else {
        sameCountTimes = 0;
      }

      previousProductCount = currentProducts;

      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          setTimeout(resolve, 2000); // 데이터 로딩 시간
        });
      });

      await page
        .waitForSelector(".grid-2 .weblog", { timeout: 5000 })
        .catch(() => {
          console.log("새로운 상품이 로드되지 않았습니다.");
        });
    }

    console.log("모든 상품 로드 완료, 데이터 수집 중...");

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll(".grid-2 .weblog");
      return Array.from(items).map((item) => {
        const link = item.querySelector("a");
        const name = item.querySelector(".info_section__title");
        const salePoint = item.querySelector(".sale_point_badge__content");
        const priceOrigin = item.querySelector(".price_info__base");
        const priceDiscount = item.querySelector(".price_info__discount");

        return {
          url: link ? link.href : "",
          name: name ? name.textContent.trim() : "",
          salePoint: salePoint ? salePoint.textContent.trim() : "",
          price: priceDiscount ? priceDiscount.textContent.trim() : "",
          originalPrice: priceOrigin ? priceOrigin.textContent.trim() : "",
        };
      });
    });

    console.log("\n=== 크롤링 결과 ===");
    console.log("총 상품 수:", products.length);
    products.forEach((product, index) => {
      console.log(`\n[상품 ${index + 1}]`);
      console.log("상품명:", product.name);
      console.log("할인정보:", product.salePoint);
      console.log("가격:", product.price);
      console.log("원래가격:", product.originalPrice);
      console.log("URL:", product.url);
    });

    await browser.close();
  } catch (error) {
    console.error("크롤링 중 에러 발생:", error);
  }
};

crawler();
