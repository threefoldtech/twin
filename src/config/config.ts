const userid = process.env.USER_ID || 'patatje3';

const appId = process.env.DIGITALTWIN_APPID || 'digitaltwin.jimbertesting.be';
const environment = process.env.ENVIRONMENT || 'production';

export const config = {
    port: parseInt(process.env.PORT, 10) || 3000,
    node_env: process.env.NODE_ENV || 'development',
    appBackend: environment === 'production' ? 'https://login.threefold.me' : 'https://login.staging.jimber.io',
    kycBackend: environment === 'production' ? 'https://openkyc.live' : 'http://openkyc.staging.jimber.org',
    documentServerLocation:
        environment === 'production'
            ? 'https://documentserver.digitaltwin.jimbertesting.be/'
            : 'https://documentserver.digitaltwin-test.jimbertesting.be/',
    appId: `${userid}.${appId}`,
    seedPhrase:
        'calm science teach foil burst until next mango hole sponsor fold bottom cousin push focus track truly tornado turtle over tornado teach large fiscal',
    baseDir: process.env.BASEDIR || '/appdata/',
    userid,
    storage: '/storage/',
    yggdrasil: {
        peers: [
            "tcp://smithtacticalsolutions.com:9943",
            "tcp://108.242.38.186:9943",
            "tls://ipv4.campina-grande.paraiba.brazil.yggdrasil.iasylum.net:50000",
            "tls://192.99.145.61:58226",
            "tls://yyz.yuetau.net:6643",
            "tls://ca1.servers.devices.cwinfo.net:58226",
            "tls://65.21.57.122:61995",
            "tls://95.216.5.243:18836",
            "tls://fi1.servers.devices.cwinfo.net:61995",
            "tls://aurora.devices.waren.io:18836",
            "tls://ygg-fin.incognet.io:8884",
            "tls://152.228.216.112:23108",
            "tls://51.255.223.60:54232",
            "tls://cloudberry.fr1.servers.devices.cwinfo.net:54232",
            "tls://62.210.85.80:39575",
            "tls://fr2.servers.devices.cwinfo.net:23108",
            "tls://s2.i2pd.xyz:39575",
            "tls://p2p-node.de:1338?key=000000d80a2d7b3126ea65c8c08fc751088c491a5cdd47eff11c86fa1e4644ae",
            "tls://vpn.ltha.de:443?key=0000006149970f245e6cec43664bce203f2514b60a153e194f31e2b229a1339d",
            "tls://ygg.mkg20001.io:443",
            "tls://ygg1.mk16.de:1338?key=0000000087ee9949eeab56bd430ee8f324cad55abf3993ed9b9be63ce693e18a",
            "tls://ygg2.mk16.de:1338?key=00000002e71368e36f2fae8fe437e09f935dcf69ee08dc00afe02ad7eae2f5f7",
            "tls://01.ffm.deu.ygg.yt:443",
            "tls://01.blr.ind.ygg.yt:443",
            "tls://01.tky.jpn.ygg.yt:443",
            "tls://minecast.xyz:3785",
            "tls://01.mxc.mex.ygg.yt:443",
            "tls://94.103.82.150:8080",
            "tls://45.147.198.155:6010",
            "tls://ygg-nl.incognet.io:8884",
            "tls://ipv4.dronten.flevoland.netherlands.iasylum.net:50000",
            "tls://ipv6.dronten.flevoland.netherlands.iasylum.net:51000",
            "tls://aaoth.xyz:25565",
            "tls://ygg1.ezdomain.ru:11130",
            "tls://ygg2.ezdomain.ru:11130",
            "tls://ipv4.warsaw.poland.yggdrasil.iasylum.net:50000",
            "tls://54.37.137.221:11129",
            "tls://pl1.servers.devices.cwinfo.net:11129",
            "tls://185.165.169.234:8443",
            "tls://188.225.9.167:18227",
            "tls://yggno.de:18227",
            "tls://ygg.tomasgl.ru:61944?key=c5e0c28a600c2118e986196a0bbcbda4934d8e9278ceabea48838dc5d8fae576",
            "tls://ygg.loskiq.ru:17314",
            "tls://176.215.237.83:8443?sni=irk.peering.flying-squid.host&key=f69da2c11d5fe8bcee7d026a6ed28dc7873db9ecb88c797b29348546e411d934",
            "tls://yggpvs.duckdns.org:8443",
            "tls://ygg0.ezdomain.ru:11130",
            "tls://158.101.229.219:17001",
            "tls://sin.yuetau.net:6643",
            "tls://01.sgp.sgp.ygg.yt:443",
            "tls://01.sel.kor.ygg.yt:443",
            "tls://185.130.44.194:7040",
            "tls://ygg.ace.ctrl-c.liu.se:9999?key=5636b3af4738c3998284c4805d91209cab38921159c66a6f359f3f692af1c908",
            "tls://193.111.114.28:1443",
            "tls://91.224.254.114:18001",
            "tls://ygg-ukr.incognet.io:8884",
            "tls://51.38.64.12:28395",
            "tls://185.175.90.87:43006",
            "tls://uk1.servers.devices.cwinfo.net:28395",
            "tls://01.lon.gbr.ygg.yt:443",
            "tls://108.175.10.127:61216",
            "tls://longseason.1200bps.xyz:13122",
            "tls://supergay.network:9001",
            "tls://lancis.iscute.moe:49274",
            "tls://167.160.89.98:7040",
            "tls://ygg-ny-us.incognet.io:8884",
            "tls://44.234.134.124:443",
            "tls://ygg-tx-us.incognet.io:8884",
            "tls://bazari.sh:3725",
            "tls://lax.yuetau.net:6643",
            "tls://ygg-nv-us.incognet.io:8884",
            "tls://yggdrasil.sticloud.gq:13122",
            "tls://51.81.46.170:5222",
            "tls://01.scv.usa.ygg.yt:443",
            "tf-tcp://gent01.grid.tf:9943",
            "tf-tcp://gent02.grid.tf:9943",
            "tf-tcp://gent03.grid.tf:9943",
            "tf-tcp://gent04.grid.tf:9943",
            "tf-tcp://gent01.test.grid.tf:9943",
            "tf-tcp://gent02.test.grid.tf:9943",
            "tf-tcp://gent01.dev.grid.tf:9943",
            "tf-tcp://gent02.dev.grid.tf:9943",
            "tf-tcp://gw291.vienna1.greenedgecloud.com:9943",
            "tf-tcp://gw293.vienna1.greenedgecloud.com:9943",
            "tf-tcp://gw294.vienna1.greenedgecloud.com:9943",
            "tf-tcp://gw297.vienna1.greenedgecloud.com:9943",
            "tf-tcp://gw298.vienna1.greenedgecloud.com:9943",
            "tf-tcp://gw299.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw300.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw304.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw306.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw307.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw309.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw313.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw324.salzburg1.greenedgecloud.com:9943",
            "tf-tcp://gw326.salzburg1.greenedgecloud.com:9943",
            "tf-tcp://gw327.salzburg1.greenedgecloud.com:9943",
            "tf-tcp://gw328.salzburg1.greenedgecloud.com:9943",
            "tf-tcp://gw330.salzburg1.greenedgecloud.com:9943",
            "tf-tcp://gw331.salzburg1.greenedgecloud.com:9943",
            "tf-tcp://gw333.salzburg1.greenedgecloud.com:9943",
            "tf-tcp://gw422.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw423.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw424.vienna2.greenedgecloud.com:9943",
            "tf-tcp://gw425.vienna2.greenedgecloud.com:9943"
        ],
    },
    sessionSecret: process.env.SESSION_SECRET || 'secret',
};
