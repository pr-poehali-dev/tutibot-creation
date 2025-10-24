import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
};

type Chat = {
  id: string;
  name: string;
  messages: Message[];
  timestamp: Date;
};

type Theme = {
  id: string;
  name: string;
  gradient: string;
  color: string;
};

const themes: Theme[] = [
  { id: 'purple', name: 'Фиолетовая', gradient: 'from-purple-500 to-purple-600', color: 'hsl(var(--theme-purple))' },
  { id: 'blue', name: 'Голубая', gradient: 'from-blue-400 to-blue-500', color: 'hsl(var(--theme-blue))' },
  { id: 'green', name: 'Зеленая', gradient: 'from-green-500 to-green-600', color: 'hsl(var(--theme-green))' },
  { id: 'orange', name: 'Оранжевая', gradient: 'from-orange-500 to-orange-600', color: 'hsl(var(--theme-orange))' },
  { id: 'pink', name: 'Розовая', gradient: 'from-pink-500 to-pink-600', color: 'hsl(var(--theme-pink))' },
];

const STORAGE_KEY = 'tutibot_data';

export default function Index() {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.chats.map((chat: Chat) => ({
        ...chat,
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        timestamp: new Date(chat.timestamp)
      }));
    }
    return [{
      id: '1',
      name: 'Чат 1',
      messages: [{ id: '1', text: 'Привет! Я TuTiBot. Я слушаюсь всем приказам и отвечаю на любые вопросы. Чем могу помочь?', sender: 'bot', timestamp: new Date() }],
      timestamp: new Date()
    }];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).currentChatId : '1';
  });

  const [selectedTheme, setSelectedTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const themeId = JSON.parse(saved).themeId;
      return themes.find(t => t.id === themeId) || themes[0];
    }
    return themes[0];
  });

  const [botName, setBotName] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).botName : 'TuTiBot';
  });

  const [botAvatar, setBotAvatar] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).botAvatar : '🤖';
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.lang = 'ru-RU';
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = () => {
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  useEffect(() => {
    const dataToSave = {
      chats,
      currentChatId,
      themeId: selectedTheme.id,
      botName,
      botAvatar
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [chats, currentChatId, selectedTheme, botName, botAvatar]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateCurrentChat = (updater: (messages: Message[]) => Message[]) => {
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: updater(chat.messages), timestamp: new Date() }
        : chat
    ));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    updateCurrentChat(msgs => [...msgs, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Понял ваш запрос: "${inputText}". Я выполняю любые команды и отвечаю на вопросы!`,
        sender: 'bot',
        timestamp: new Date(),
      };
      updateCurrentChat(msgs => [...msgs, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const imageMessage: Message = {
          id: Date.now().toString(),
          text: 'Отправил фото',
          sender: 'user',
          timestamp: new Date(),
          image: imageUrl,
        };
        updateCurrentChat(msgs => [...msgs, imageMessage]);
        
        setIsTyping(true);
        setTimeout(() => {
          const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: 'Отличное фото! Я вижу изображение и могу его проанализировать. Что вы хотите узнать о нём?',
            sender: 'bot',
            timestamp: new Date(),
          };
          updateCurrentChat(msgs => [...msgs, botResponse]);
          setIsTyping(false);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestartChat = () => {
    updateCurrentChat(() => [
      { id: Date.now().toString(), text: `Привет! Я ${botName}. Чат перезапущен. Чем могу помочь?`, sender: 'bot', timestamp: new Date() }
    ]);
  };

  const handleCreateNewChat = () => {
    const newChatId = (Date.now()).toString();
    const newChat: Chat = {
      id: newChatId,
      name: `Чат ${chats.length + 1}`,
      messages: [
        { id: Date.now().toString(), text: `Привет! Я ${botName}. Новый чат создан. Чем могу помочь?`, sender: 'bot', timestamp: new Date() }
      ],
      timestamp: new Date(),
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChatId);
  };

  const handleDeleteChat = (chatId: string) => {
    if (chats.length === 1) return;
    
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(c => c.id !== chatId);
      setCurrentChatId(remainingChats[0]?.id || '1');
    }
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      alert('Голосовой ввод не поддерживается вашим браузером');
      return;
    }
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header 
        className={`bg-gradient-to-r ${selectedTheme.gradient} text-white p-4 shadow-lg`}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Icon name="Menu" size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Чаты</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <Button onClick={handleCreateNewChat} className="w-full mb-4" variant="outline">
                    <Icon name="Plus" size={18} className="mr-2" />
                    Новый чат
                  </Button>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    {chats.map(chat => (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-lg mb-2 transition-colors group ${
                          currentChatId === chat.id ? 'bg-primary/10' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            onClick={() => setCurrentChatId(chat.id)}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium">{chat.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {chat.messages[chat.messages.length - 1]?.text || 'Нет сообщений'}
                            </div>
                          </div>
                          {chats.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteChat(chat.id)}
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>

            <Avatar className="w-10 h-10">
              <AvatarFallback className="text-2xl">{botAvatar}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">{botName}</h1>
              <p className="text-xs opacity-90">всегда онлайн</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Icon name="Settings" size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Настройки</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <Label>Имя бота</Label>
                    <Input
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="mt-2"
                      placeholder="Введите имя"
                    />
                  </div>

                  <div>
                    <Label>Аватарка (эмодзи)</Label>
                    <Input
                      value={botAvatar}
                      onChange={(e) => setBotAvatar(e.target.value)}
                      className="mt-2"
                      placeholder="🤖"
                      maxLength={2}
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label className="mb-3 block">Тема чата</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {themes.map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme)}
                          className={`p-4 rounded-lg bg-gradient-to-r ${theme.gradient} text-white font-medium transition-all ${
                            selectedTheme.id === theme.id ? 'ring-4 ring-offset-2 ring-primary scale-105' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          {theme.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <Button onClick={handleRestartChat} variant="destructive" className="w-full">
                    <Icon name="RotateCcw" size={18} className="mr-2" />
                    Перезапустить бота
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex items-start gap-3 animate-fade-in ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {message.sender === 'bot' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-lg">{botAvatar}</AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tr-sm'
                    : 'bg-white border border-gray-200 rounded-tl-sm'
                }`}
              >
                {message.image && (
                  <img src={message.image} alt="Uploaded" className="rounded-lg mb-2 max-w-full" />
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-3 animate-fade-in">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-lg">{botAvatar}</AvatarFallback>
              </Avatar>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className={`flex-shrink-0 bg-gradient-to-r ${selectedTheme.gradient} hover:opacity-90 transition-opacity`}
          >
            <Icon name="Send" size={20} className="mr-2" />
            Отправить
          </Button>

          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isRecording ? "Говорите..." : "Введите сообщение..."}
            className="flex-1"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0"
          >
            <Icon name="Image" size={22} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceInput}
            className={`flex-shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
          >
            <Icon name={isRecording ? "MicOff" : "Mic"} size={22} />
          </Button>
        </div>
      </div>
    </div>
  );
}