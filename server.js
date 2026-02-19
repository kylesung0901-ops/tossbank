const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 테스트용 시크릿 키
const SECRET_KEY = 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
const encodedSecretKey = Buffer.from(SECRET_KEY + ':').toString('base64');

// 임시 DB (메모리 저장소)
const billingKeysDb = [];
const paymentsDb = []; // 결제 완료 내역 저장

// [요구사항 2] 빌링 인증 성공 시 호출되는 라우트
app.get('/api/success', async (req, res) => {
    const { customerKey, authKey } = req.query;

    if (!customerKey || !authKey) {
        return res.status(400).send('잘못된 요청입니다. customerKey와 authKey가 필요합니다.');
    }

    try {
        // [요구사항 2-3] 빌링키 발급 API 호출
        const response = await axios.post(
            'https://api.tosspayments.com/v1/billing/authorizations/issue',
            {
                customerKey,
                authKey
            },
            {
                headers: {
                    'Authorization': `Basic ${encodedSecretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const billingData = response.data;

        // [요구사항 3-1] DB 저장 로직 (메모리에 저장)
        billingKeysDb.push({
            customerKey: billingData.customerKey,
            billingKey: billingData.billingKey,
            card: billingData.card,
            authenticatedAt: billingData.authenticatedAt
        });

        console.log('빌링키 발급 성공 및 저장 완료:', billingData);

        // 성공 화면 응답 (사용자에게 보일 메시지)
        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>카드 등록 성공!</h1>
                <p>빌링키가 성공적으로 발급되었습니다.</p>
                <p>Customer Key: ${customerKey}</p>
                <button onclick="window.close()">창 닫기</button>
            </div>
        `);
    } catch (error) {
        console.error('빌링키 발급 에러:', error.response ? error.response.data : error.message);
        const errorData = error.response ? error.response.data : { message: '알 수 없는 에러가 발생했습니다.' };

        // [요구사항 3-2] 에러 발생 시 예외 처리
        res.status(500).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px; color: red;">
                <h1>에러 발생</h1>
                <p>${errorData.message}</p>
                <button onclick="history.back()">뒤로 가기</button>
            </div>
        `);
    }
});

// [요구사항 2-1] 실패 라우트
app.get('/api/fail', (req, res) => {
    const { code, message } = req.query;
    console.error('인증 실패:', code, message);

    res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px; color: red;">
            <h1>인증 실패</h1>
            <p>에러 코드: ${code}</p>
            <p>메시지: ${message}</p>
            <button onclick="window.close()">창 닫기</button>
        </div>
    `);
});

// --- Checkout (Payment Widget) 전용 라우트 ---

// 결제 성공 시 리다이렉트되는 라우트
app.get('/success', (req, res) => {
    const { paymentKey, orderId, amount } = req.query;

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>결제 성공</title>
            <meta charset="utf-8">
            <style>
                body { font-family: sans-serif; text-align: center; padding: 50px; background: #f4f7fa; }
                .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: inline-block; }
                h1 { color: #3182f6; }
                .price { font-size: 2rem; font-weight: bold; margin: 20px 0; }
                .btn { background: #3182f6; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>결제 요청 성공!</h1>
                <p>이제 서버에서 결제 승인을 진행합니다.</p>
                <div class="price">${Number(amount).toLocaleString()}원</div>
                <p>주문번호: ${orderId}</p>
                <button id="confirm-btn" class="btn">최종 결제 승인하기</button>
            </div>
            <script>
                document.getElementById('confirm-btn').addEventListener('click', async () => {
                    const response = await fetch('/api/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentKey: '${paymentKey}',
                            orderId: '${orderId}',
                            amount: ${amount}
                        })
                    });
                    
                    if (response.ok) {
                        alert('결제가 최종 승인되었습니다!');
                        location.href = '/';
                    } else {
                        const error = await response.json();
                        alert('결제 승인 실패: ' + error.message);
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// 결제 실패 시 리다이렉트되는 라우트
app.get('/fail', (req, res) => {
    const { message, code } = req.query;
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #f04452;">결제 실패</h1>
            <p>${message}</p>
            <p>코드: ${code}</p>
            <a href="/" style="color: #3182f6;">상점으로 돌아가기</a>
        </div>
    `);
});

// 결제 승인 API 호출
app.post('/api/confirm', async (req, res) => {
    const { paymentKey, orderId, amount } = req.body;

    try {
        const response = await axios.post(
            'https://api.tosspayments.com/v1/payments/confirm',
            { paymentKey, orderId, amount },
            {
                headers: {
                    'Authorization': `Basic ${encodedSecretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // 결제 내역 저장
        paymentsDb.push(response.data);
        console.log('결제 승인 성공:', response.data);

        res.status(200).json(response.data);
    } catch (error) {
        console.error('결제 승인 에러:', error.response ? error.response.data : error.message);
        res.status(500).json(error.response ? error.response.data : { message: '결제 승인 중 에러 발생' });
    }
});

app.listen(port, () => {
    console.log(`백엔드 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
